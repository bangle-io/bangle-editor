import React from 'react';
import reactDOM from 'react-dom';
import { BangleEditor, useEditorState } from '@bangle.dev/react';
import { SpecRegistry } from '@bangle.dev/core';
import { defaultPlugins, defaultSpecs } from '@bangle.dev/all-base-components';

export function setupReactEditor({
  specRegistry,
  plugins = () => defaultPlugins,
  renderNodeViews,
  id = 'pm-root',
  children,
} = {}) {
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

function App({
  children,
  opts: { specRegistry, plugins, renderNodeViews, id },
}) {
  const onEditorReady = (_editor) => {
    window.editor = _editor;
  };

  window.dispatcher = (command) => {
    return command(
      window.editor.view.state,
      window.editor.view.dispatch,
      window.editor.view,
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
