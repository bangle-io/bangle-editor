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
  children,
}: {
  specRegistry?: SpecRegistry;
  plugins?: RawPlugins;
  renderNodeViews?: RenderNodeViewsFunction;
  id: string;
  children?: React.ReactNode;
}) {
  const element = document.createElement('div');
  window.document.body.appendChild(element);
  element.setAttribute('id', 'root');
  if (!(specRegistry instanceof SpecRegistry)) {
    specRegistry = new SpecRegistry(defaultSpecs(specRegistry));
  }

  reactDOM.render(
    <App opts={{ specRegistry, plugins, renderNodeViews, id }}>{children}</App>,
    element,
  );
}

export const win: any = window;

function App({
  children,
  opts: { specRegistry, plugins, renderNodeViews, id },
}: {
  children: React.ReactNode;
  opts: {
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
      state={editorState}
      onReady={onEditorReady}
      renderNodeViews={renderNodeViews}
    >
      {children}
    </BangleEditor>
  );
}
