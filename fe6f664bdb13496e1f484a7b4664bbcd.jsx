import React from 'react';
import { useEditorState, BangleEditor } from '@bangle.dev/react';

import '@bangle.dev/core/style.css';

export default function Editor() {
  const editorState = useEditorState({
    initialValue: 'Hello world!',
  });
  return <BangleEditor state={editorState} />;
}
