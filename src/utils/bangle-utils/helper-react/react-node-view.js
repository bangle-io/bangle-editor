import React from 'react';
import { createPortal } from 'react-dom';
import debounce from 'debounce';
import { Editor } from '../editor';
import { Node } from '../nodes';

// Note: this HOC is needed as it creates/manages n number of ReactNodeView
// depending on PM.
export function reactNodeViewHOC(node = new Node(), editor = new Editor()) {
  if (!node instanceof Node) {
    throw new Error('Only Extension');
  }
  if (!node.view) {
    throw new Error('neeed view');
  }

  class ParentNodeView extends React.Component {
    constructor(props) {
      super(props);
      this.counter = 0;

      this.debouncedForceUpdate = debounce(this.forceUpdate.bind(this), 30);

      this.domElementMap = new Map();

      editor.attachNodeView(node.name, this.initializeNodeView);
    }

    // TODO: need to think more about unmount and clearing up
    componentWillUnmount() {
      this.debouncedForceUpdate.clear();
    }

    // Returns the node object needed by https://prosemirror.net/docs/ref/#view.EditorProps.nodeViews
    initializeNodeView = (pmNode, view, getPos, decorations) => {
      // As an optimization I can throttle and queue the results
      const nodeViewInstance = {};

      const dom = document.createElement(pmNode.isInline ? 'span' : 'div');

      nodeViewInstance.dom = dom;

      nodeViewInstance.destroy = () => {
        this.onNodeViewDestroy(dom);
      };

      this.domElementMap.set(dom, {
        key: this.counter++,
        nodeViewProps: {
          node: pmNode,
          view,
          getPos,
          decorations,
          nodeViewInstance,
        },
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
      // TODO: one optimization I can do is to preserve the react work if the props are exactly the same
      //  the only difference is dom element changed
      return Array.from(this.domElementMap).map(([pmDom, value]) =>
        createPortal(
          <node.view
            nodeViewProps={value.nodeViewProps}
            {...passThroughProps}
          />,
          pmDom,
          value.key, // I have verified adding a stable key does improve performance by reducing re-renders
        ),
      );
    }
  }

  ParentNodeView.propTypes = {};

  ParentNodeView.displayName = `ParentNodeView[${node.name}]`;

  return ParentNodeView;
}

export class ReactNodeView extends React.PureComponent {
  constructor(props) {
    super(props);
    const {
      nodeViewProps: { node, view, getPos, decorations, nodeViewInstance },
    } = this.props;

    this.nodeView = {
      node,
      view,
      getPos,
      decorations,
    };

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
}
