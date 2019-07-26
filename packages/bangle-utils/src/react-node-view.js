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

      this.componentMap = new WeakMap();
      this.counterMap = new WeakMap();
      this.pmDoms = new Set();

      this.initializeNodeView = this.initializeNodeView.bind(this); // As an optimization I can throttle and queue the results
      this.onNodeViewDestroy = this.onNodeViewDestroy.bind(this); // As an optimization I can throttle and queue the results, right now the view is destroed for everything in the row

      props.addNodeView({
        [Comp.Schema.type]: this.initializeNodeView
      });

      props.addSchema(Comp.Schema);
    }

    initializeNodeView(node, view, getPos, decorations) {
      const nodeViewInstance = {};

      const dom = node.isInline
        ? document.createElement('span')
        : document.createElement('div');

      nodeViewInstance.dom = dom;

      nodeViewInstance.destroy = () => {
        this.onNodeViewDestroy(dom);
      };
      this.counterMap.set(dom, this.counter++);
      this.componentMap.set(
        dom,
        React.cloneElement(<Comp />, {
          nodeViewProps: {
            node,
            view,
            getPos,
            decorations,
            nodeViewInstance
          }
        })
      );

      this.pmDoms.add(dom);
      this.debouncedForceUpdate();

      return nodeViewInstance;
    }

    onNodeViewDestroy(dom) {
      this.pmDoms.delete(dom);
    }

    render() {
      return Array.from(this.pmDoms).map(pmDom => (
        // I have verified adding a stable key does improve performance by reducing rerenders
        <React.Fragment key={this.counterMap.get(pmDom)}>
          {createPortal(this.componentMap.get(pmDom), pmDom)}
        </React.Fragment>
      ));
    }
  }

  ParentNodeView.propTypes = {
    addNodeView: PropTypes.func.isRequired,
    addSchema: PropTypes.func.isRequired
  };

  ParentNodeView.displayName = `ParentNodeView[${Comp.Schema.type}]`;

  return ParentNodeView;
}

export class ReactNodeView extends React.PureComponent {
  constructor(props) {
    super(props);
    const {
      nodeViewProps: { node, view, getPos, decorations, nodeViewInstance }
    } = this.props;

    this.nodeView = {
      node,
      view,
      getPos,
      decorations
    };

    // Note the destroy methods and the props dom, contentDom are handled by parent
    // and the component extending this class shouldn't worry about them
    const pmMethodsMapping = [
      ['update', 'nodeViewUpdate'],
      ['selectNode', 'nodeViewSelectNode'],
      ['deselectNode', 'nodeViewDeselectNode'],
      ['setSelection', 'nodeViewSetSelection'],
      ['stopEvent', 'nodeViewStopEvent'],
      ['ignoreMutation', 'nodeViewIgnoreMutation']
    ].filter(m => !!this[m[1]]); // check if class has implemented these

    for (const [pmMethod, method] of pmMethodsMapping) {
      nodeViewInstance[pmMethod] = this[method].bind(this);
    }
  }
}
