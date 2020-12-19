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
  ItalicButton,
  MenuButton,
} from '@banglejs/react-menu';
import { queryIsLinkActive } from '@banglejs/core/components/link';

const menuKey = new PluginKey('menuKey');

function MyCustomButton() {
  return (
    <MenuButton
      hintPos="top"
      hint="Hola"
      onMouseDown={(e) => {
        e.preventDefault();
      }}
      isActive={true}
    >
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <text
          x="12"
          y="12"
          stroke="currentColor"
          textAnchor="middle"
          alignmentBaseline="central"
          dominantBaseline="middle"
        >
          Hi
        </text>
      </svg>
    </MenuButton>
  );
}

export default function Example() {
  const editorState = useEditorState({
    specs: coreSpec(),
    plugins: () => [
      corePlugins(),
      floatingMenu.plugins({
        key: menuKey,
        calculateType: (state, prevType) => {
          if (queryIsLinkActive()(state)) {
            return 'linkSubMenu';
          }
          if (state.selection.empty) {
            return null;
          }
          return 'defaultMenu';
        },
      }),
    ],
    initialValue: `<div>
      <p>Hello I am a paragraph.</p>
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
                  <MyCustomButton />
                </MenuGroup>
                <MenuGroup>
                  <HeadingButton level={2} />
                  <HeadingButton level={3} />
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
