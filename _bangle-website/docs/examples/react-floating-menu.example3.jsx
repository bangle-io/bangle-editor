import '@banglejs/core/style.css';
import '@banglejs/tooltip/style.css';
import '@banglejs/react-menu/style.css';
import React from 'react';
import { BangleEditor, useEditorState } from '@banglejs/react';
import { PluginKey } from '@banglejs/core';
import { corePlugins, coreSpec } from '@banglejs/core/utils/core-components';
import {
  floatingMenu,
  FloatingMenu,
  Menu,
  MenuGroup,
  BoldButton,
  HeadingButton,
  BulletListButton,
  ItalicButton,
  HeadingDropdownButton,
} from '@banglejs/react-menu';

const menuKey = new PluginKey('menuKey');

export default function Example() {
  const editorState = useEditorState({
    specs: coreSpec(),
    plugins: () => [
      ...corePlugins(),
      floatingMenu.plugins({
        key: menuKey,
        calculateType: (state, prevType) => {
          // A user has selected a range of text, lets show them
          // the default menu.
          if (!state.selection.empty) {
            return 'defaultMenu';
          }

          // Set the type to null to indicate that a menu is not needed.
          return null;
        },
      }),
    ],
    initialValue: `<div>
      <p>Hello I am a paragraph, please upgrade me to a heading.</p>
      <p>Hello I am a paragraph, please upgrade me to a heading.</p>
      <p>Hello I am a paragraph, please upgrade me to a heading.</p>
      <p>Hello I am a paragraph, please upgrade me to a heading.</p>
    </div>`,
  });

  return (
    <BangleEditor state={editorState}>
      <FloatingMenu
        menuKey={menuKey}
        renderMenuType={({ type }) => {
          if (type === 'defaultMenu') {
            return (
              <Menu>
                <MenuGroup>
                  <BoldButton />
                  <ItalicButton />
                </MenuGroup>
                <MenuGroup>
                  <HeadingButton level={1} />
                  <HeadingButton level={2} />
                  <BulletListButton />
                </MenuGroup>
                <HeadingDropdownButton />
              </Menu>
            );
          }

          return null;
        }}
      />
    </BangleEditor>
  );
}
