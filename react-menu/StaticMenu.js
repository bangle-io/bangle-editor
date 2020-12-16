import React from 'react';
import { EditorViewContext } from '@banglejs/react/ReactEditor';
import { editorStateCounter } from '@banglejs/core/index';
import { usePluginState } from '@banglejs/react/hooks';

export function StaticMenu({ editor, render }) {
  return editor ? (
    <EditorViewContext.Provider value={editor.view}>
      <StaticMenuContainer render={render}></StaticMenuContainer>
    </EditorViewContext.Provider>
  ) : null;
}

function StaticMenuContainer({ render }) {
  usePluginState(editorStateCounter.key, true);
  return render();
}
