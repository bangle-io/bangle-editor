import {
  BangleEditor as CoreBangleEditor,
  BangleEditorProps as CoreBangleEditorProps,
  BangleEditorState as CoreBangleEditorState,
} from '@bangle.dev/core';
import { EditorView, Plugin } from '@bangle.dev/pm';
import { objectUid } from '@bangle.dev/utils';
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import reactDOM from 'react-dom';
import { nodeViewUpdateStore, useNodeViews } from './node-view-helpers';
import { NodeViewWrapper, RenderNodeViewsFunction } from './NodeViewWrapper';

const LOG = false;

let log = LOG ? console.log.bind(console, 'react-editor') : () => {};

export const EditorViewContext = React.createContext<EditorView>(
  /* we have to provide a default value to createContext */
  null as unknown as EditorView,
);

interface BangleEditorProps<PluginMetadata = any>
  extends CoreBangleEditorProps<PluginMetadata> {
  id?: string;
  children?: React.ReactNode;
  renderNodeViews?: RenderNodeViewsFunction;
  className?: string;
  style?: React.CSSProperties;
  onReady?: (editor: CoreBangleEditor<PluginMetadata>) => void;
}

export function BangleEditor<PluginMetadata = any>({
  id,
  state,
  children,
  focusOnInit = true,
  pmViewOpts,
  renderNodeViews,
  className,
  style,
  onReady = () => {},
}: BangleEditorProps<PluginMetadata>) {
  const renderRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  const editorViewPayloadRef = useRef({
    state,
    focusOnInit,
    pmViewOpts,
  });
  const [editor, setEditor] = useState<CoreBangleEditor>();
  const nodeViews = useNodeViews(renderRef);

  useEffect(() => {
    const editor = new CoreBangleEditor<CoreBangleEditor>(
      renderRef.current!,
      editorViewPayloadRef.current,
    );
    (editor.view as any)._updatePluginWatcher = updatePluginWatcher(editor);
    onReadyRef.current(editor);
    setEditor(editor);
    return () => {
      editor.destroy();
    };
  }, []);

  if (nodeViews.length > 0 && renderNodeViews == null) {
    throw new Error(
      'When using nodeViews, you must provide renderNodeViews callback',
    );
  }

  return (
    <React.Fragment>
      <div ref={renderRef} id={id} className={className} style={style} />
      {nodeViews.map((nodeView) => {
        return reactDOM.createPortal(
          <NodeViewWrapper
            debugKey={objectUid.get(nodeView)}
            nodeViewUpdateStore={nodeViewUpdateStore}
            nodeView={nodeView}
            renderNodeViews={renderNodeViews!}
          />,
          nodeView.containerDOM!,
          objectUid.get(nodeView),
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
