import PropTypes from 'prop-types';
import React from 'react';
import { BangleEditor } from '@banglejs/core';
import { usePluginState, EditorViewContext } from '@banglejs/react';
import { editorStateCounter } from '@banglejs/core/index';

export function StaticMenu({ editor, renderMenu }) {
  return editor ? (
    <EditorViewContext.Provider value={editor.view}>
      <StaticMenuContainer renderMenu={renderMenu}></StaticMenuContainer>
    </EditorViewContext.Provider>
  ) : null;
}

StaticMenu.propTypes = {
  renderMenu: PropTypes.func.isRequired,
  editor: PropTypes.instanceOf(BangleEditor),
};

function StaticMenuContainer({ renderMenu }) {
  usePluginState(editorStateCounter.docChangedKey, true);
  usePluginState(editorStateCounter.selectionChangedKey, true);
  return renderMenu();
}
