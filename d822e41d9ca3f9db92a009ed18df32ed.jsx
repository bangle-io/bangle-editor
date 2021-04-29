import '@bangle.dev/core/style.css';
import '@bangle.dev/tooltip/style.css';
import '@bangle.dev/react-menu/style.css';
import React from 'react';
import { BangleEditor, useEditorState } from '@bangle.dev/react';
import { PluginKey, components } from '@bangle.dev/core';
import { corePlugins, coreSpec } from '@bangle.dev/core/utils/core-components';
import {
  floatingMenu,
  FloatingMenu,
  Menu,
  MenuGroup,
  BoldButton,
  HeadingButton,
  BulletListButton,
  ItalicButton,
  FloatingLinkButton,
} from '@bangle.dev/react-menu';

const menuKey = new PluginKey('menuKey');

export default function Example() {
  const editorState = useEditorState({
    specs: coreSpec(),
    plugins: () => [
      ...corePlugins(),
      floatingMenu.plugins({
        key: menuKey,
        calculateType: (state, prevType) => {
          // Use the 'headingSubMenu' type whenever
          // the selection is inside a heading.
          if (components.heading.commands.queryIsHeadingActive()(state)) {
            return 'headingSubMenu';
          }

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
      <h3>I am a heading try selecting me</h3>
    </div>`,
  });

  return (
    <BangleEditor state={editorState}>
      <FloatingMenu
        menuKey={menuKey}
        renderMenuType={({ type }) => {
          // Use the type we earlier calculated to show
          // our custom menu
          if (type === 'headingSubMenu') {
            return (
              <Menu>
                <span>This is a heading!</span>
              </Menu>
            );
          }

          if (type === 'defaultMenu') {
            return (
              <Menu>
                <MenuGroup>
                  <BoldButton />
                  <ItalicButton />
                  <FloatingLinkButton menuKey={menuKey} />
                </MenuGroup>
                <MenuGroup>
                  <HeadingButton level={1} />
                  <HeadingButton level={2} />
                  <BulletListButton />
                </MenuGroup>
              </Menu>
            );
          }

          return null;
        }}
      />
    </BangleEditor>
  );
}
