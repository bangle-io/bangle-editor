import React from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

// Note: The comp must be PureComponent as we are passing a big fat prop `nodeViewProps`
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

      this.componentMap = new WeakMap();
      this.state = {
        pmDoms: []
      };

      this.initializeNodeView = this.initializeNodeView.bind(this);
      this.onNodeViewDestroy = this.onNodeViewDestroy.bind(this);

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

      this.setState(({ pmDoms }) => ({ pmDoms: [...pmDoms, dom] }));

      return nodeViewInstance;
    }

    onNodeViewDestroy(dom) {
      this.setState(({ pmDoms }) => ({
        pmDoms: pmDoms.filter(r => r !== dom)
      }));
    }

    render() {
      return (
        <>
          {this.state.pmDoms.map((pmDom, i) =>
            createPortal(this.componentMap.get(pmDom), pmDom)
          )}
        </>
      );
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
    ].filter(m => !!this[m[1]]);

    for (const [pmMethod, method] of pmMethodsMapping) {
      nodeViewInstance[pmMethod] = this[method].bind(this);
    }
  }
}
