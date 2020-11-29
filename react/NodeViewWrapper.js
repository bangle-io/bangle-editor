import React from 'react';
import { bangleWarn } from '@banglejs/core/utils/js-utils';
import { objUid } from '@banglejs/core/utils/object-uid';
import { Node, EditorView } from '@banglejs/core';
import PropTypes from 'prop-types';

const LOG = false;

let log = LOG ? console.log.bind(console, 'NodeViewWrapper') : () => {};

export class NodeViewWrapper extends React.PureComponent {
  static propTypes = {
    nodeView: PropTypes.object.isRequired,
    renderNodeViews: PropTypes.func.isRequired,
    nodeViewUpdateStore: PropTypes.instanceOf(WeakMap).isRequired,
  };

  update = () => {
    this.setState((state, props) => ({
      nodeViewProps: props.nodeView.getNodeViewProps(),
    }));
  };

  constructor(props) {
    super(props);
    // So that we can directly update the nodeView without the mess
    // of prop forwarding. This is okay because a nodeView and ReactComponent has
    // 1:1 mapping always.
    props.nodeViewUpdateStore.set(props.nodeView, this.update);
    this.state = { nodeViewProps: this.props.nodeView.getNodeViewProps() };
  }

  attachToContentDOM = (reactElement) => {
    if (!reactElement) {
      return;
    }
    const { contentDOM } = this.props.nodeView;
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

  getChildren() {
    if (!this.props.nodeView.contentDOM) {
      return null;
    }

    if (this.state.nodeViewProps.node.isInline) {
      return (
        // The bangle-content-mount is needed to keep the content take space
        // or else browsers will collapse it, making it hard to type
        <span className="bangle-content-mount" ref={this.attachToContentDOM} />
      );
    }

    return (
      <div className="bangle-content-mount" ref={this.attachToContentDOM} />
    );
  }

  render() {
    log('react rendering', objUid.get(this.props.nodeView));
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
