import React, { useEffect, useRef, useState } from 'react';
import reactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { objUid } from '@bangle.dev/core/utils/object-uid';
import {
  BangleEditor as CoreBangleEditor,
  BangleEditorProps as CoreBangleEditorProps,
} from '@bangle.dev/core/bangle-editor';
import { BangleEditorState as CoreBangleEditorState } from '@bangle.dev/core/bangle-editor-state';
import { NodeView, saveRenderHandlers } from '@bangle.dev/core/node-view';
import { NodeViewWrapper, RenderNodeViewsFunction } from './NodeViewWrapper';
import {
  nodeViewRenderHandlers,
  nodeViewUpdateStore,
} from './node-view-helpers';
import { EditorView } from '@bangle.dev/core/prosemirror/view';
import { Plugin } from '@bangle.dev/core/plugin';

const LOG = false;

let log = LOG ? console.log.bind(console, 'react-editor') : () => {};

export const EditorViewContext = React.createContext<EditorView>(
  /* we have to provide a default value to createContext */
  null as unknown as EditorView,
);

interface BangleEditorProps extends CoreBangleEditorProps {
  id: string;
  children: React.ReactNode;
  renderNodeViews: RenderNodeViewsFunction;
  className: string;
  style?: React.CSSProperties;
  onReady?: (editor: CoreBangleEditor) => void;
}

export function BangleEditor({
  id,
  state,
  children,
  focusOnInit = true,
  pmViewOpts,
  renderNodeViews,
  className,
  style,
  onReady = () => {},
}: BangleEditorProps) {
  const renderRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  const editorViewPayloadRef = useRef({
    state,
    focusOnInit,
    pmViewOpts,
  });
  const [nodeViews, setNodeViews] = useState<NodeView[]>([]);
  const [editor, setEditor] = useState<CoreBangleEditor>();

  useEffect(() => {
    let destroyed = false;
    // save the renderHandlers in the dom to decouple nodeView instantiating code
    // from the editor. Since PM passing view when nodeView is created, the author
    // of the component can get the handler reference from `getRenderHandlers(view)`.
    // Note: this assumes that the pm's dom is the direct child of `editorRenderTarget`.
    saveRenderHandlers(
      renderRef.current!,
      nodeViewRenderHandlers((cb) => {
        // use callback for of setState to avoid
        // get fresh nodeViews
        if (!destroyed) {
          // @ts-ignore TS flow analysis would infer this branching is
          // impossible and assign a <never> type
          setNodeViews((nodeViews) => cb(nodeViews));
        }
      }),
    );
    const editor = new CoreBangleEditor(
      renderRef.current!,
      editorViewPayloadRef.current,
    );
    (editor.view as any)._updatePluginWatcher = updatePluginWatcher(editor);
    onReadyRef.current(editor);
    setEditor(editor);
    return () => {
      destroyed = true;
      editor.destroy();
    };
  }, []);

  return (
    <React.Fragment>
      <div ref={renderRef} id={id} className={className} style={style} />
      {nodeViews.map((nodeView) => {
        return reactDOM.createPortal(
          <NodeViewWrapper
            debugKey={objUid.get(nodeView)}
            nodeViewUpdateStore={nodeViewUpdateStore}
            nodeView={nodeView}
            renderNodeViews={renderNodeViews}
          />,
          nodeView.containerDOM!,
          objUid.get(nodeView),
        );
      })}
      {editor ? (
        <EditorViewContext.Provider value={editor.view}>
          {children}
        </EditorViewContext.Provider>
      ) : null}
    </React.Fragment>
  );
}

const updatePluginWatcher = (editor: CoreBangleEditor) => {
  return (watcher: Plugin, remove = false) => {
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
  className: PropTypes.string,
  style: PropTypes.object,
};
