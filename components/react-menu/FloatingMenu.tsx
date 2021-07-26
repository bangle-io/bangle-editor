import { EditorState, PluginKey } from '@bangle.dev/pm';
import { usePluginState, useEditorViewContext } from '@bangle.dev/react';
import PropTypes from 'prop-types';
import React from 'react';
import reactDOM from 'react-dom';
import { hasComponentInSchema } from './helper';
import { LinkSubMenu } from './LinkSubMenu';
import { Menu } from './Menu';
import {
  BoldButton,
  BulletListButton,
  CodeButton,
  FloatingLinkButton,
  HeadingButton,
  ItalicButton,
  TodoListButton,
} from './MenuButtons';
import { MenuGroup } from './MenuGroup';

export function FloatingMenu({
  menuKey,
  renderMenuType = ({ type, menuKey, editorState }) => {
    if (type === 'defaultMenu') {
      //  NOTE these hasComponentInSchema checks exist because this is a default callback value
      // and it cannot make any assumptions on the schema.
      // The API is designed so that the user overrides this with their own callback and since they
      // would know the schema, they wouldnt need such checks.
      return (
        <Menu>
          <MenuGroup>
            {hasComponentInSchema(editorState, 'bold') && <BoldButton />}
            {hasComponentInSchema(editorState, 'italic') && <ItalicButton />}
            {hasComponentInSchema(editorState, 'code') && <CodeButton />}
            {hasComponentInSchema(editorState, 'link') && (
              <FloatingLinkButton menuKey={menuKey} />
            )}
          </MenuGroup>
          <MenuGroup>
            {hasComponentInSchema(editorState, 'heading') && (
              <HeadingButton level={2} />
            )}
            {hasComponentInSchema(editorState, 'heading') && (
              <HeadingButton level={3} />
            )}
            {hasComponentInSchema(editorState, 'bulletList') && (
              <BulletListButton />
            )}
            {hasComponentInSchema(editorState, 'bulletList') && (
              <TodoListButton />
            )}
          </MenuGroup>
        </Menu>
      );
    }
    if (type === 'linkSubMenu') {
      return (
        <Menu>
          <LinkSubMenu />
        </Menu>
      );
    }
    return null;
  },
}: {
  menuKey: PluginKey;
  renderMenuType?: (opts: {
    menuKey: PluginKey;
    type: string;
    editorState: EditorState;
  }) => JSX.Element | null;
}) {
  const menuState = usePluginState(menuKey);
  const view = useEditorViewContext();

  const renderElement = renderMenuType({
    type: menuState.type,
    menuKey,
    editorState: view.state,
  });

  return renderElement
    ? reactDOM.createPortal(renderElement, menuState.tooltipContentDOM)
    : null;
}

FloatingMenu.propTypes = {
  menuKey: PropTypes.instanceOf(PluginKey).isRequired,
  renderMenuType: PropTypes.func,
};
