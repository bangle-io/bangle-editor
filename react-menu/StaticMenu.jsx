import PropTypes from 'prop-types';
import React from 'react';
import { BangleEditor } from '@bangle.dev/core';
import { editorStateCounter } from '@bangle.dev/core/components/components';
import { usePluginState, EditorViewContext } from '@bangle.dev/react';

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
