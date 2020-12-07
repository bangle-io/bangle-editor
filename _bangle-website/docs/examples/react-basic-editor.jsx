import React from 'react';
import { useEditorState, EditorView } from '@banglejs/react';
import { corePlugins } from '@banglejs/core/utils/core-components';

import '@banglejs/core/style.css';

export default function Editor() {
  const editorState = useEditorState({
    plugins: corePlugins,
    initialValue: 'Hello world!',
  });
  return <EditorView editorState={editorState} />;
}
