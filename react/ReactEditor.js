import React, { useEffect, useRef, useState } from 'react';
import reactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { objUid } from '@banglejs/core/utils/object-uid';
import {
  BangleEditorState as CoreBangleEditorState,
  BangleEditor as CoreBangleEditor,
} from '@banglejs/core';
import { saveRenderHandlers } from '@banglejs/core/node-view';
import { NodeViewWrapper } from './NodeViewWrapper';
import {
  nodeViewRenderHandlers,
  nodeViewUpdateStore,
} from './node-view-helpers';

const LOG = false;

let log = LOG ? console.log.bind(console, 'react-editor') : () => {};

export const EditorViewContext = React.createContext();

export function BangleEditor({
  id,
  state,
  children,
  focusOnInit = true,
  pmViewOpts,
  renderNodeViews,
  onReady = () => {},
}) {
  const renderRef = useRef();
  const onReadyRef = useRef(onReady);
  const editorViewPayloadRef = useRef({
    state,
    focusOnInit,
    pmViewOpts,
  });
  const [nodeViews, setNodeViews] = useState([]);
  const [editor, setEditor] = useState();

  useEffect(() => {
    let destroyed = false;
    // save the renderHandlers in the dom to decouple nodeView instantiating code
    // from the editor. Since PM passing view when nodeView is created, the author
    // of the component can get the handler reference from `getRenderHandlers(view)`.
    // Note: this assumes that the pm's dom is the direct child of `editorRenderTarget`.
    saveRenderHandlers(
      renderRef.current,
      nodeViewRenderHandlers((cb) => {
        // use callback for of setState to avoid
        // get fresh nodeViews
        if (!destroyed) {
          setNodeViews((nodeViews) => cb(nodeViews));
        }
      }),
    );
    const editor = new CoreBangleEditor(
      renderRef.current,
      editorViewPayloadRef.current,
    );
    editor.view._updatePluginWatcher = updatePluginWatcher(editor);
    onReadyRef.current(editor);
    setEditor(editor);
    return () => {
      destroyed = true;
      editor.destroy();
    };
  }, []);

  return (
    <>
      <div ref={renderRef} id={id} />
      {nodeViews.map((nodeView) => {
        return reactDOM.createPortal(
          <NodeViewWrapper
            debugKey={objUid.get(nodeView)}
            nodeViewUpdateStore={nodeViewUpdateStore}
            nodeView={nodeView}
            renderNodeViews={renderNodeViews}
          />,
          nodeView.mountDOM,
          objUid.get(nodeView),
        );
      })}
      {editor ? (
        <EditorViewContext.Provider value={editor.view}>
          {children}
        </EditorViewContext.Provider>
      ) : null}
    </>
  );
}

const updatePluginWatcher = (editor) => {
  return (watcher, remove = false) => {
    if (editor.destroyed) {
      return;
    }

    let state = editor.view.state;

    const newPlugins = remove
      ? state.plugins.filter((p) => p !== watcher)
      : [...state.plugins, watcher];

    state = state.reconfigure({
      plugins: newPlugins,
    });

    log('Adding watching to existing state', watcher);
    editor.view.updateState(state);
  };
};

BangleEditor.propTypes = {
  id: PropTypes.string,
  renderNodeViews: PropTypes.func,
  onReady: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element),
  ]),
  state: PropTypes.instanceOf(CoreBangleEditorState).isRequired,
  pmViewOpts: PropTypes.object,
};
