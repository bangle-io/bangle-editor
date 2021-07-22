import { NodeView, NodeViewProps } from '@bangle.dev/core';
import { EditorView, Node } from '@bangle.dev/pm';
import { bangleWarn, objectUid } from '@bangle.dev/utils';
import PropTypes from 'prop-types';
import React from 'react';

const LOG = false;

let log = LOG ? console.log.bind(console, 'NodeViewWrapper') : () => {};

export type RenderNodeViewsFunction = (props: any) => React.ReactNode;

interface PropsType {
  debugKey: string;
  nodeView: NodeView;
  renderNodeViews: RenderNodeViewsFunction;
  nodeViewUpdateStore: WeakMap<NodeView, () => void>;
}

interface StateType {
  nodeViewProps: NodeViewProps;
}

export class NodeViewWrapper extends React.PureComponent<PropsType, StateType> {
  static propTypes = {
    nodeView: PropTypes.object.isRequired,
    renderNodeViews: PropTypes.func.isRequired,
    nodeViewUpdateStore: PropTypes.instanceOf(WeakMap).isRequired,
  };

  update: () => void;
  attachToContentDOM: (reactElement: HTMLDivElement) => void;

  constructor(props: PropsType) {
    super(props);

    this.update = () => {
      this.setState((_state, props) => ({
        nodeViewProps: props.nodeView.getNodeViewProps(),
      }));
    };

    this.attachToContentDOM = (reactElement) => {
      if (!reactElement) {
        return;
      }
      const contentDOM = this.props.nodeView.contentDOM!;
      // Since we do not control how many times this callback is called
      // make sure it is not already mounted.
      if (!reactElement.contains(contentDOM)) {
        // If contentDOM happens to be mounted to someone else
        // remove it from there.
        if (contentDOM.parentNode) {
          contentDOM.parentNode.removeChild(contentDOM);
        }
        reactElement.appendChild(contentDOM);
      }
    };
    // So that we can directly update the nodeView without the mess
    // of prop forwarding.
    // What about updating the wrong nodeView ?
    // It is okay because a nodeView and this ReactComponent will always
    // have a 1:1 mapping. This is guaranteed because you use `nodeView` instance
    // to generate a react key. See the usage of this component in ./ReactEditor.js
    props.nodeViewUpdateStore.set(props.nodeView, this.update);
    this.state = { nodeViewProps: this.props.nodeView.getNodeViewProps() };
  }

  getChildren() {
    if (!this.props.nodeView.contentDOM) {
      return null;
    }

    if (this.state.nodeViewProps.node.isInline) {
      return (
        // The bangle-nv-content is needed to keep the content take space
        // or else browsers will collapse it, making it hard to type
        <span
          className="bangle-nv-child-container"
          ref={this.attachToContentDOM}
        />
      );
    }

    return (
      <div
        className="bangle-nv-child-container"
        ref={this.attachToContentDOM}
      />
    );
  }

  render() {
    log('react rendering', objectUid.get(this.props.nodeView));
    const element = this.props.renderNodeViews({
      ...this.state.nodeViewProps,
      children: this.getChildren(),
    });
    if (!element) {
      bangleWarn(
        'renderNodeView prop must return a react element for the node',
        this.state.nodeViewProps.node,
      );
      throw new Error(
        `renderNodeView must handle rendering for node of type "${this.state.nodeViewProps.node.type.name}"`,
      );
    }
    return element;
  }
}

export const atomNodeViewPropTypes = {
  selected: PropTypes.bool.isRequired,
  node: PropTypes.instanceOf(Node).isRequired,
  view: PropTypes.instanceOf(EditorView).isRequired,
  getPos: PropTypes.func.isRequired,
  decorations: PropTypes.object.isRequired,
  attrs: PropTypes.object.isRequired,
  updateAttrs: PropTypes.func.isRequired,
};

export const nodeViewPropTypes = {
  ...atomNodeViewPropTypes,
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element),
  ]).isRequired,
};
