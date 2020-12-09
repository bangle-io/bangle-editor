import React from 'react';
import { useEditorState, BangleEditorView } from '@banglejs/react';

import '@banglejs/core/style.css';

export default function Editor() {
  const editorState = useEditorState({
    initialValue: 'Hello world!',
  });
  return <BangleEditorView state={editorState} />;
}
