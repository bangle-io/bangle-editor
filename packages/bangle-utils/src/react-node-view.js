import React from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import debounce from 'debounce';

// Note: this HOC is needed as it creates/manages n number of ReactNodeView
// depending on PM.
export function reactNodeViewHOC(Comp) {
  if (!Comp instanceof ReactNodeView) {
    throw new Error('Only react node view');
  }
  if (!Comp.hasOwnProperty('Schema')) {
    throw new Error('Define schema');
  }

  class ParentNodeView extends React.Component {
    constructor(props) {
      super(props);
      this.counter = 0;

      this.debouncedForceUpdate = debounce(this.forceUpdate.bind(this), 30);

      this.domElementMap = new Map();

      this.initializeNodeView = this.initializeNodeView.bind(this); // As an optimization I can throttle and queue the results
      this.onNodeViewDestroy = this.onNodeViewDestroy.bind(this); // As an optimization I can throttle and queue the results, right now the view is destroed for everything in the row

      props.addNodeView({
        [Comp.Schema.type]: this.initializeNodeView,
      });
      props.addSchema(Comp.Schema);
    }

    // TODO: need to think more about unmount and clearing up
    componentWillUnmount() {
      this.debouncedForceUpdate.clear();
    }

    // Returns the node object needed by https://prosemirror.net/docs/ref/#view.EditorProps.nodeViews
    initializeNodeView(node, view, getPos, decorations) {
      const nodeViewInstance = {};

      const dom = document.createElement(node.isInline ? 'span' : 'div');

      nodeViewInstance.dom = dom;

      nodeViewInstance.destroy = () => {
        this.onNodeViewDestroy(dom);
      };

      this.domElementMap.set(dom, {
        key: this.counter++,
        nodeViewProps: {
          node,
          view,
          getPos,
          decorations,
          nodeViewInstance,
        },
      });

      this.debouncedForceUpdate();

      return nodeViewInstance;
    }

    onNodeViewDestroy(dom) {
      this.domElementMap.delete(dom);
    }

    render() {
      const { addNodeView, addSchema, ...passThroughProps } = this.props;
      // TODO: one optimization I can do is to preserve the react work if the props are exactly the same
      //  the only difference is dom element changed
      return Array.from(this.domElementMap).map(([pmDom, value]) =>
        createPortal(
          <Comp nodeViewProps={value.nodeViewProps} {...passThroughProps} />,
          pmDom,
          value.key, // I have verified adding a stable key does improve performance by reducing re-renders
        ),
      );
    }
  }

  ParentNodeView.propTypes = {
    addNodeView: PropTypes.func.isRequired,
    addSchema: PropTypes.func.isRequired,
  };

  ParentNodeView.displayName = `ParentNodeView[${Comp.Schema.type}]`;

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
