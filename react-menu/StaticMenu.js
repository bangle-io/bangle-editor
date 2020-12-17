import React from 'react';
import { EditorViewContext } from '@banglejs/react/ReactEditor';
import { editorStateCounter } from '@banglejs/core/index';
import { usePluginState } from '@banglejs/react/hooks';

export function StaticMenu({ editor, renderMenu }) {
  return editor ? (
    <EditorViewContext.Provider value={editor.view}>
      <StaticMenuContainer renderMenu={renderMenu}></StaticMenuContainer>
    </EditorViewContext.Provider>
  ) : null;
}

function StaticMenuContainer({ renderMenu }) {
  usePluginState(editorStateCounter.docChangedKey, true);
  usePluginState(editorStateCounter.selectionChangedKey, true);
  return renderMenu();
}
