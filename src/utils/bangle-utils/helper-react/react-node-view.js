import React from 'react';
import { createPortal } from 'react-dom';
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
      const nodeViewInstance = {
        node: pmNode,
        view,
        getPos,
        decorations,
        editor,
        extension,
        viewShouldUpdate: false,
        onDelete: this.onNodeViewDestroy,
        onRerender: this.debouncedForceUpdate,
      };

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
