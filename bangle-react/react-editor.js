import React from 'react';
import reactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { objUid } from 'bangle-core/utils/object-uid';
import { BangleEditor } from 'bangle-core/editor';
import { saveRenderHandlers } from 'bangle-core/node-view';
import { bangleWarn } from 'bangle-core/utils/js-utils';

const LOG = false;

let log = LOG ? console.log.bind(console, 'react-editor') : () => {};

const nodeViewUpdateArgsCache = new WeakMap();
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
    create: (nodeViewInstance, nodeViewArgs) => {
      log('create');
      nodeViewUpdateArgsCache.set(nodeViewInstance, nodeViewArgs);
      this.setState({
        nodeViews: [...this.state.nodeViews, nodeViewInstance],
      });
    },
    update: (nodeViewInstance, nodeViewArgs) => {
      log('update');
      nodeViewUpdateArgsCache.set(nodeViewInstance, nodeViewArgs);
      const updateCallback = nodeViewUpdateCallbackCache.get(nodeViewInstance);
      // I am thinking that this might be called before react had the chance
      // to mount. I believe saving of args in nodeViewArgsCache will get the react
      // render up to date with latest nodeViewArgs
      if (updateCallback) {
        updateCallback();
      }
    },
    destroy: (nodeViewInstance) => {
      log('destroy');

      this.setState({
        nodeViews: this.state.nodeViews.filter((n) => n !== nodeViewInstance),
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
        {this.state.nodeViews.map((nodeViewInstance) => {
          return reactDOM.createPortal(
            <ChildElement
              nodeView={nodeViewInstance}
              renderNodeViews={this.props.renderNodeViews}
            />,
            nodeViewInstance.mountDOM,
            objUid.get(nodeViewInstance),
          );
        })}
      </>
    );
  }
}

class ChildElement extends React.PureComponent {
  updateArgs = () => {
    const args = nodeViewUpdateArgsCache.get(this.props.nodeView);
    this.setState(args);
  };

  constructor(props) {
    super(props);
    // This is okay because a nodeView and ReactComponent has
    // 1:1 mapping always.
    nodeViewUpdateCallbackCache.set(props.nodeView, this.updateArgs);
    this.state = nodeViewUpdateArgsCache.get(props.nodeView);
  }

  render() {
    // TODO more assertion on this renderNodeViews
    const element = this.props.renderNodeViews({ ...this.state });
    if (!element) {
      bangleWarn(
        'renderNodeView prop must return a react element for the node',
        this.state.node,
      );
      throw new Error(
        `Missing react render for node of type "${this.state.node.type.name}"`,
      );
    }
    return element;
  }
}
