import '@bangle.dev/react-menu/style.css';
import '@bangle.dev/tooltip/style.css';
import {
  corePlugins,
  coreSpec,
  PluginKey,
  setSelectionAtEnd,
} from '@bangle.dev/core';
import '@bangle.dev/core/style.css';
import { BangleEditor, useEditorState } from '@bangle.dev/react';
import {
  BlockquoteButton,
  BulletListButton,
  floatingMenu,
  FloatingMenu,
  HeadingButton,
  Menu,
  OrderedListButton,
  ParagraphButton,
  TodoListButton,
} from '@bangle.dev/react-menu';

import React from 'react';

const menuKey = new PluginKey('menuKey');

export default function Example() {
  const editorState = useEditorState({
    specs: coreSpec(),
    plugins: () => [
      ...corePlugins(),
      floatingMenu.plugins({
        key: menuKey,
        tooltipRenderOpts: {
          // This is the key to getting the behaviour we want
          placement: 'right',
        },
        calculateType: (state) => {
          const parent = state.selection.$from.parent;
          // Trigger the menu when selection is empty and the parent node is empty.
          return state.selection.empty && parent && parent.content.size === 0
            ? 'defaultMenu'
            : null;
        },
      }),
    ],
    initialValue: `<div>
      <p>Hey this example is cool, ain't it?</p>
      <p></p>
    </div>`,
  });

  return (
    <BangleEditor
      state={editorState}
      onReady={({ view }) => {
        setSelectionAtEnd(view.state.doc)(view.state, view.dispatch);
      }}
    >
      <FloatingMenu
        menuKey={menuKey}
        renderMenuType={({ type }) => {
          if (type === 'defaultMenu') {
            return (
              <Menu
                style={{
                  backgroundColor: 'transparent',
                  color:
                    document.documentElement.getAttribute('data-theme') ===
                    'dark'
                      ? 'white'
                      : 'black',
                }}
              >
                <ParagraphButton />
                <BlockquoteButton />
                <HeadingButton level={1} />
                <HeadingButton level={2} />
                <BulletListButton />
                <OrderedListButton />
                <TodoListButton />
              </Menu>
            );
          }
          return null;
        }}
      />
    </BangleEditor>
  );
}
