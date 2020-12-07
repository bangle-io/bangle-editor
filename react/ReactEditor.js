import React from 'react';
import reactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { objUid } from '@banglejs/core/utils/object-uid';
import { BangleEditor } from '@banglejs/core/editor';
import { saveRenderHandlers } from '@banglejs/core/node-view';
import { NodeViewWrapper } from './NodeViewWrapper';

const LOG = false;

let log = LOG ? console.log.bind(console, 'react-editor') : () => {};

const nodeViewUpdateStore = new WeakMap();

const renderHandlers = (updateNodeViews) => ({
  create: (nodeView, nodeViewProps) => {
    log('create', objUid.get(nodeView));
    updateNodeViews((nodeViews) => [...nodeViews, nodeView]);
  },
  update: (nodeView, nodeViewProps) => {
    log('update', objUid.get(nodeView));
    const updateCallback = nodeViewUpdateStore.get(nodeView);
    // If updateCallback is undefined (which can happen if react took long to mount),
    // we are still okay, as the latest nodeViewProps will be accessed whenever it mounts.
    if (updateCallback) {
      updateCallback();
    }
  },
  destroy: (nodeView) => {
    log('destroy', objUid.get(nodeView));
    updateNodeViews((nodeViews) => nodeViews.filter((n) => n !== nodeView));
  },
});

export const EditorViewContext = React.createContext();

export class ReactEditor extends React.PureComponent {
  static contextType = EditorViewContext;

  static propTypes = {
    options: PropTypes.object.isRequired,
    renderNodeViews: PropTypes.func,
    onReady: PropTypes.func,
    children: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.arrayOf(PropTypes.element),
    ]),
  };

  editorRenderTarget = React.createRef();
  state = { nodeViews: [], editor: null };

  get editor() {
    if (this.destroyed) {
      return null;
    }

    return this.state.editor;
  }

  async componentDidMount() {
    const { options } = this.props;
    // save the renderHandlers in the dom to decouple nodeView instantiating code
    // from the editor. Since PM passing view when nodeView is created, the author
    // of the component can get the handler reference from `getRenderHandlers(view)`.
    // Note: this assumes that the pm's dom is the direct child of `editorRenderTarget`.
    saveRenderHandlers(
      this.editorRenderTarget.current,
      renderHandlers((cb) => {
        this.setState(({ nodeViews }) => ({ nodeViews: cb(nodeViews) }));
      }),
    );

    const editor = new BangleEditor(this.editorRenderTarget.current, options);

    editor.view._updatePluginWatcher = this.updatePluginWatcher;

    if (this.props.onReady) {
      this.props.onReady(editor);
    }

    this.setState({
      editor,
    });
  }

  updatePluginWatcher = (watcher, remove = false) => {
    if (!this.editor) {
      return;
    }

    let state = this.editor.view.state;

    const newPlugins = remove
      ? state.plugins.filter((p) => p !== watcher)
      : [...state.plugins, watcher];

    state = state.reconfigure({
      plugins: newPlugins,
    });

    log('Adding watching to existing state', watcher);
    this.editor.view.updateState(state);
  };

  componentWillUnmount() {
    console.log('unmounting');
    if (!this.destroyed) {
      this.editor && this.editor.destroy();
      this.destroyed = true;
    }
  }

  render() {
    log(
      'rendering PMEditorWrapper',
      this.state.nodeViews.map((n) => objUid.get(n)),
    );

    return (
      <>
        <div ref={this.editorRenderTarget} id={this.props.options.id} />
        {this.state.nodeViews.map((nodeView) => {
          return reactDOM.createPortal(
            <NodeViewWrapper
              nodeViewUpdateStore={nodeViewUpdateStore}
              nodeView={nodeView}
              renderNodeViews={this.props.renderNodeViews}
            />,
            nodeView.mountDOM,
            objUid.get(nodeView),
          );
        })}
        {this.editor && (
          <EditorViewContext.Provider value={this.editor.view}>
            {this.props.children}
          </EditorViewContext.Provider>
        )}
      </>
    );
  }
}
