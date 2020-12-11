import '@banglejs/core/style.css';
import '@banglejs/tooltip/style.css';
import '@banglejs/react-menu/style.css';
import React from 'react';
import { BangleEditor, useEditorState } from '@banglejs/react';
import { PluginKey, heading, link } from '@banglejs/core';
import { corePlugins, coreSpec } from '@banglejs/core/utils/core-components';
import {
  floatingMenu,
  FloatingMenu,
  Menu,
  FloatingLinkMenu,
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
          if (heading.commands.queryIsHeadingActive()(state)) {
            return 'headingMenu';
          }
          if (link.commands.queryIsLinkActive()(state)) {
            return 'floatingLinkMenu';
          }
          if (state.selection.empty) {
            return null;
          }
          return 'floatingMenu';
        },
      }),
    ],
    initialValue: `<div>
      <span>Hello I am a paragraph, try selecting me too</span>
      <h3>I am a heading try selecting me</h3>
      <span>Oh don't forget this awesome <a href="https://blog.ycombinator.com/the-airbnbs/">article!</a></span>
    </div>`,
  });

  return (
    <BangleEditor state={editorState}>
      <FloatingMenu
        menuKey={menuKey}
        renderMenuType={({ type }) => {
          if (type === 'headingMenu') {
            return (
              <span className="bangle-menu">
                I get activated inside a heading
              </span>
            );
          }
          if (type === 'floatingLinkMenu') {
            return <FloatingLinkMenu menuKey={menuKey} />;
          }
          if (type === 'floatingMenu') {
            return <Menu menuKey={menuKey} />;
          }
          return null;
        }}
      />
    </BangleEditor>
  );
}
