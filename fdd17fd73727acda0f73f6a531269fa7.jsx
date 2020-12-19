import '@banglejs/core/style.css';
import '@banglejs/tooltip/style.css';
import '@banglejs/react-menu/style.css';
import React, { useState } from 'react';
import { BangleEditor, useEditorState } from '@banglejs/react';
import { PluginKey } from '@banglejs/core';
import { corePlugins, coreSpec } from '@banglejs/core/utils/core-components';
import {
  floatingMenu,
  StaticMenu,
  Menu,
  HeadingButton,
  ParagraphButton,
  BlockquoteButton,
  BulletListButton,
  OrderedListButton,
  TodoListButton,
  BoldButton,
  ItalicButton,
  MenuGroup,
} from '@banglejs/react-menu';

const menuKey = new PluginKey('menuKey');

export default function Example() {
  const [editor, setEditor] = useState();
  const editorState = useEditorState({
    specs: coreSpec(),
    plugins: () => [
      corePlugins(),
      floatingMenu.plugins({
        key: menuKey,
      }),
    ],
    initialValue: `<div>Hi there, try selecting me to see a floating menu.
    <br/>
    <span>Also, checkout this awesome <a href="https://blog.ycombinator.com/the-airbnbs/">article!</a></span>
    </div>`,
  });

  return (
    <>
      <StaticMenu
        editor={editor}
        // We have a render prop to allow for updating
        // menu whenever editors state changes
        renderMenu={() => (
          <Menu
            style={{
              backgroundColor: 'transparent',
              color:
                document.documentElement.getAttribute('data-theme') === 'dark'
                  ? 'white'
                  : 'black',
            }}
          >
            <MenuGroup>
              <BoldButton />
              <ItalicButton />
            </MenuGroup>
            <MenuGroup>
              <ParagraphButton />
              <BlockquoteButton />
              <HeadingButton level={2} />
              <HeadingButton level={3} />
            </MenuGroup>
            <BulletListButton />
            <OrderedListButton />
            <TodoListButton />
          </Menu>
        )}
      />
      <BangleEditor state={editorState} onReady={setEditor} />
    </>
  );
}
