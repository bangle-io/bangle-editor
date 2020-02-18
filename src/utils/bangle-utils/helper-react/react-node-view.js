import React from 'react';
import {
  createPortal,
  render,
  unstable_renderSubtreeIntoContainer,
} from 'react-dom';
import debounce from 'debounce';
import { getMarkRange } from 'tiptap-utils';

import { Editor } from '../editor';
import { Extension } from '../extensions';

// Note: this HOC is needed as it creates/manages n number of ReactNodeView
// depending on PM.
export function reactNodeViewHOC(
  extension = new Extension(),
  editor = new Editor(),
) {
  if (!extension instanceof Node) {
    throw new Error('Only Extension');
  }
  if (!extension.view) {
    throw new Error('neeed view');
  }

  class ParentNodeView extends React.Component {
    constructor(props) {
      super(props);
      this.counter = 0;

      this.debouncedForceUpdate = debounce(this.forceUpdate.bind(this), 30);

      this.domElementMap = new Map();

      editor.attachNodeView(extension.name, this.initializeNodeView);
    }

    // TODO: need to think more about unmount and clearing up
    componentWillUnmount() {
      this.debouncedForceUpdate.clear();
    }

    // Returns the node object needed by https://prosemirror.net/docs/ref/#view.EditorProps.nodeViews
    initializeNodeView = (pmNode, view, getPos, decorations) => {
      // As an optimization I can throttle and queue the results
      const nodeViewInstance = tempFunc({
        node: pmNode,
        view,
        getPos,
        decorations,
        editor,
        extension,
        viewShouldUpdate: false,
        onDelete: this.onNodeViewDestroy,
        onRerender: this.debouncedForceUpdate,
      });

      this.domElementMap.set(nodeViewInstance.domRef, {
        key: this.counter++,
        nodeViewInstance,
        reactComp: nodeViewInstance.reactComp(),
      });

      this.debouncedForceUpdate();

      return nodeViewInstance;
    };

    // As an optimization I can throttle and queue the results, right now the view is destroed for everything in the row
    onNodeViewDestroy = (dom) => {
      this.domElementMap.delete(dom); // TODO do I need to rerender react>?
    };

    render() {
      const { ...passThroughProps } = this.props;
      // console.log('render');
      // TODO: one optimization I can do is to preserve the react work if the props are exactly the same
      //  the only difference is dom element changed
      return Array.from(this.domElementMap).map(([pmDom, value]) =>
        createPortal(
          <value.reactComp
            editor={editor}
            nodeView={value.nodeViewInstance}
            node={value.nodeViewInstance.node}
            view={value.nodeViewInstance.view}
            {...passThroughProps}
          />,
          pmDom,
          value.key, // I have verified adding a stable key does improve performance by reducing re-renders
        ),
      );
    }
  }

  ParentNodeView.propTypes = {};

  ParentNodeView.displayName = `ParentNodeView[${extension.name}]`;

  return ParentNodeView;
}

export class ReactNodeView extends React.PureComponent {
  constructor(props) {
    super(props);
    const {
      nodeView: {
        node,
        view,
        getPos,
        dom,
        decorations,
        extension,
        nodeViewInstance,
      },
    } = this.props;

    this.nodeView = {
      extension,
      dom,
      node,
      view,
      getPos,
      decorations,
    };
    this.captureEvents = true;

    // Note the destroy methods and the props dom, contentDom are handled by parent
    // and the component extending this class shouldn't worry about them
    const pmMethodsMapping = [
      ['update', 'nodeViewUpdate'],
      ['selectNode', 'nodeViewSelectNode'],
      ['deselectNode', 'nodeViewDeselectNode'],
      ['setSelection', 'nodeViewSetSelection'],
      ['stopEvent', 'nodeViewStopEvent'],
      ['ignoreMutation', 'nodeViewIgnoreMutation'],
    ].filter((m) => !!this[m[1]]); // check if class has implemented these

    for (const [pmMethod, method] of pmMethodsMapping) {
      nodeViewInstance[pmMethod] = this[method].bind(this);
    }
  }

  nodeViewStopEvent(event) {
    const { extension, dom } = this.nodeView;
    if (typeof extension.stopEvent === 'function') {
      return extension.stopEvent(event);
    }

    const draggable = !!extension.schema.draggable;

    // support a custom drag handle
    if (draggable && event.type === 'mousedown') {
      const dragHandle =
        event.target.closest && event.target.closest('[data-drag-handle]');
      const isValidDragHandle =
        dragHandle && (dom === dragHandle || dom.contains(dragHandle));

      if (isValidDragHandle) {
        this.captureEvents = false;
        document.addEventListener(
          'dragend',
          () => {
            this.captureEvents = true;
          },
          { once: true },
        );
      }
    }

    const isCopy = event.type === 'copy';
    const isPaste = event.type === 'paste';
    const isCut = event.type === 'cut';
    const isDrag = event.type.startsWith('drag') || event.type === 'drop';

    if ((draggable && isDrag) || isCopy || isPaste || isCut) {
      return false;
    }

    return this.captureEvents;
  }
  get isNode() {
    return !!this.nodeView.node.marks;
  }
  get isMark() {
    return !this.isNode;
  }
  get pos() {
    if (this.isMark) {
      return getMarkPos(this.nodeView);
    }
    return this.nodeView.getPos();
  }

  updateAttrs = (attrs) => {
    const {
      nodeView: { view, node },
    } = this;

    if (!view.editable) {
      return;
    }

    const newAttrs = {
      ...node.attrs,
      ...attrs,
    };

    let transaction;
    const pos = this.pos;

    if (this.isMark) {
      transaction = view.state.tr
        .removeMark(pos.from, pos.to, node.type)
        .addMark(pos.from, pos.to, node.type.create(newAttrs));
    } else {
      transaction = view.state.tr.setNodeMarkup(pos, null, newAttrs);
    }

    view.dispatch(transaction);
  };
}

function getMarkPos(nodeView) {
  const { view, node, dom } = nodeView;
  const pos = view.posAtDOM(dom);
  const resolvedPos = view.state.doc.resolve(pos);
  const range = getMarkRange(resolvedPos, node.type);
  return range;
}

function tempFunc({
  node,
  view,
  getPos,
  decorations,
  editor,
  viewShouldUpdate,
  extension,
  onDelete,
  onRerender,
}) {
  class NodeView {
    constructor({
      node,
      view,
      getPos,
      decorations,
      editor,
      viewShouldUpdate,
      onDelete,
    }) {
      this.node = node;
      this.view = view;
      this.getPos = getPos;
      this.decorations = decorations;
      this.editor = editor;
      this._viewShouldUpdate = viewShouldUpdate; // atlas

      this._isNode = !!this.node.marks;
      this._isMark = !this._isNode;
      this._getPos = this._isMark ? getMarkPos : getPos;

      this.init();
    }

    init() {
      debugger;
      this.dom = this.createDomRef();

      this.domRef = this.dom; // copied from atlas's reactnodeview
      this.setDomAttrs(this.node, this.domRef); // copied from atlas's reactnodeview
      const { dom: contentDOMWrapper, contentDOM } = this.getContentDOM() || {
        dom: undefined,
        contentDOM: undefined,
      };
      if (this.domRef && contentDOMWrapper) {
        this.domRef.appendChild(contentDOMWrapper);
        this.contentDOM = contentDOM ? contentDOM : contentDOMWrapper;
        this.contentDOMWrapper = contentDOMWrapper || contentDOM;
      }

      // something gets messed up during mutation processing inside of a
      // nodeView if DOM structure has nested plain "div"s, it doesn't see the
      // difference between them and it kills the nodeView
      this.domRef.classList.add(`${this.node.type.name}View-content-wrap`);

      return this;
    }

    // from atlas expected that the person may implement
    getContentDOM() {
      return undefined;
    }

    // from atlas expected that the person may implement
    createDomRef() {
      return this.node.isInline
        ? document.createElement('span')
        : document.createElement('div');
    }

    // from atlas expected that the person implement the rendering function
    reactComp = () => {
      return extension.view({}, this.handleRef);
    };

    // from atlas expected that the person may implement
    viewShouldUpdate(nextNode) {
      if (this._viewShouldUpdate) {
        return this._viewShouldUpdate(nextNode);
      }
      return true;
    }

    handleRef = (node) => this._handleRef(node);

    // gets called by the div grabbing this and using it like render(props, forWardRef) => <div ref={forwardRef} />
    _handleRef(node) {
      // debugger;
      const contentDOM = this.contentDOMWrapper || this.contentDOM;

      // move the contentDOM node inside the inner reference after rendering
      if (node && contentDOM && !node.contains(contentDOM)) {
        node.appendChild(contentDOM);
      }
      this.contentDOM = node;
    }

    get isNode() {
      return !!this.node.marks;
    }
    get isMark() {
      return !this.isNode;
    }
    get pos() {
      if (this.isMark) {
        return getMarkPos(this.nodeView);
      }
      return this.nodeView.getPos();
    }

    // pmmethod
    update(
      node,
      decorations,
      // in atlas mk2 they add a third paramater for child
      // classes to extend the update method and call
      // super.update( ) with the third param to determine whether to update or not
      // isValidUpdate ,
    ) {
      // @see https://github.com/ProseMirror/prosemirror/issues/648
      const isValidUpdate = this.node.type === node.type; // && validUpdate(this.node, node);

      if (!isValidUpdate) {
        return false;
      }

      if (this.domRef && !this.node.sameMarkup(node)) {
        this.setDomAttrs(node, this.domRef);
      }

      // View should not process a re-render if this is false.
      // We dont want to destroy the view, so we return true.
      if (!this.viewShouldUpdate(node)) {
        this.node = node;
        return true;
      }

      this.node = node;
      onRerender();

      return true;
    }

    // copied from atlasmk2
    setDomAttrs(node, element) {
      Object.keys(node.attrs || {}).forEach((attr) => {
        element.setAttribute(attr, node.attrs[attr]);
      });
    }

    destroy() {
      if (!this.domRef) {
        return;
      }
      onDelete(this.domRef);
      this.domRef = undefined;
      this.contentDOM = undefined;
    }
  }

  return new NodeView({
    node,
    view,
    getPos,
    decorations,
    editor,
    viewShouldUpdate,
  });
}
