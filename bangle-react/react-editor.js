import React from 'react';
import reactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { objUid } from 'bangle-core/utils/object-uid';
import { BangleEditor } from 'bangle-core/editor';
import { saveRenderHandlers } from 'bangle-core/node-view';
import { bangleWarn } from 'bangle-core/utils/js-utils';

const LOG = false;

let log = LOG ? console.log.bind(console, 'react-editor') : () => {};

const nodeViewUpdateCallbackCache = new WeakMap();

export class ReactEditor extends React.PureComponent {
  static propTypes = {
    options: PropTypes.object.isRequired,
    renderNodeViews: PropTypes.func,
    onReady: PropTypes.func,
  };

  editorRenderTarget = React.createRef();
  state = { nodeViews: [] };

  renderHandlers = {
    create: (nodeView, nodeViewProps) => {
      log('create');
      this.setState({
        nodeViews: [...this.state.nodeViews, nodeView],
      });
    },
    update: (nodeView, nodeViewProps) => {
      log('update');
      const updateCallback = nodeViewUpdateCallbackCache.get(nodeView);
      // I am thinking that this might be called before react had the chance
      // to mount. I believe saving of args in nodeViewPropsCache will get the react
      // render up to date with latest nodeViewProps
      if (updateCallback) {
        updateCallback();
      }
    },
    destroy: (nodeView) => {
      log('destroy');
      this.setState({
        nodeViews: this.state.nodeViews.filter((n) => n !== nodeView),
      });
    },
  };

  async componentDidMount() {
    const { options } = this.props;
    // save the renderHandlers in the dom to decouple nodeView instantiating code
    // from the editor. Since PM passing view when nodeView is created, the author
    // of the component can get the handler reference from `getRenderHandlers(view)`.
    // Note: this assumes that the pm's dom is the direct child of `editorRenderTarget`.
    saveRenderHandlers(this.editorRenderTarget.current, this.renderHandlers);
    this.editor = new BangleEditor(this.editorRenderTarget.current, options);
    if (this.props.onReady) {
      this.props.onReady(this.editor);
    }
  }

  componentWillUnmount() {
    this.editor.destroy();
    this.editor = null;
  }

  render() {
    log('rendering PMEditorWrapper');
    return (
      <>
        <div
          ref={this.editorRenderTarget}
          id={this.props.options.id}
          data-testid={this.props.options.testId}
        />
        {this.state.nodeViews.map((nodeView) => {
          return reactDOM.createPortal(
            <NodeViewElement
              nodeView={nodeView}
              renderNodeViews={this.props.renderNodeViews}
            />,
            nodeView.mountDOM,
            objUid.get(nodeView),
          );
        })}
      </>
    );
  }
}

class NodeViewElement extends React.PureComponent {
  update = () => {
    this.setState({ nodeViewProps: this.props.nodeView.getNodeViewProps() });
  };

  constructor(props) {
    super(props);
    // So that we can directly update the nodeView without the mess
    // of prop forwarding. This is okay because a nodeView and ReactComponent has
    // 1:1 mapping always.
    nodeViewUpdateCallbackCache.set(props.nodeView, this.update);
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
        <span className="bangle-content-mount" ref={this.attachToContentDOM} />
      );
    }

    return (
      <div className="bangle-content-mount" ref={this.attachToContentDOM} />
    );
  }

  render() {
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
        `Missing react render for node of type "${this.state.nodeViewProps.node.type.name}"`,
      );
    }
    return element;
  }
}
