import '@banglejs/core/style.css';
import '@banglejs/tooltip/style.css';
import '@banglejs/react-menu/style.css';
import React from 'react';
import { BangleEditor, useEditorState } from '@banglejs/react';
import { PluginKey } from '@banglejs/core';
import { corePlugins, coreSpec } from '@banglejs/core/utils/core-components';
import { floatingMenu, FloatingMenu } from '@banglejs/react-menu';

const menuKey = new PluginKey('menuKey');

export default function Example() {
  const editorState = useEditorState({
    specs: coreSpec(),
    plugins: () => [
      ...corePlugins(),
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
    <BangleEditor state={editorState}>
      <FloatingMenu menuKey={menuKey} />
    </BangleEditor>
  );
}
