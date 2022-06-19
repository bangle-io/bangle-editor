import React from 'react';
import reactDOM from 'react-dom';

import { defaultPlugins, defaultSpecs } from '@bangle.dev/all-base-components';
import { RawPlugins, SpecRegistry } from '@bangle.dev/core';
import {
  BangleEditor,
  RenderNodeViewsFunction,
  useEditorState,
} from '@bangle.dev/react';

export function setupReactEditor({
  specRegistry,
  plugins = () => defaultPlugins,
  renderNodeViews,
  id = 'pm-root',
  className,
  mountElement,
  children,
}: {
  className?: string;
  specRegistry?: SpecRegistry;
  plugins?: RawPlugins;
  renderNodeViews?: RenderNodeViewsFunction;
  id: string;
  mountElement?: HTMLElement;
  children?: React.ReactNode;
}) {
  if (!mountElement) {
    mountElement = document.createElement('div');
    window.document.body.appendChild(mountElement);
    mountElement.setAttribute('id', 'root');
  }
  if (!(specRegistry instanceof SpecRegistry)) {
    specRegistry = new SpecRegistry(defaultSpecs(specRegistry));
  }

  reactDOM.render(
    <EditorWrapper
      opts={{ specRegistry, plugins, renderNodeViews, id, className }}
    >
      {children}
    </EditorWrapper>,
    mountElement,
  );
}

export const win: any = window;

export function EditorWrapper({
  children,
  opts: { className, specRegistry, plugins, renderNodeViews, id },
}: {
  children: React.ReactNode;
  opts: {
    className?: string;
    specRegistry: SpecRegistry;
    plugins: RawPlugins;
    renderNodeViews?: RenderNodeViewsFunction;
    id: string;
  };
}) {
  const win: any = window;
  const onEditorReady = (_editor: any) => {
    win.editor = _editor;
  };

  win.dispatcher = (command: any) => {
    return command(
      win.editor.view.state,
      win.editor.view.dispatch,
      win.editor.view,
    );
  };

  const editorState = useEditorState({ specRegistry, plugins });

  return (
    <BangleEditor
      id={id}
      className={className}
      state={editorState}
      onReady={onEditorReady}
      renderNodeViews={renderNodeViews}
    >
      {children}
    </BangleEditor>
  );
}
