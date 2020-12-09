import '@banglejs/core/style.css';
import '@banglejs/tooltip/style.css';
import '@banglejs/react-menu/style.css';
import React from 'react';
import { BangleEditorView, useEditorState } from '@banglejs/react';
import { PluginKey } from '@banglejs/core';
import { corePlugins } from '@banglejs/core/utils/core-components';
import { floatingMenu, FloatingMenu } from '@banglejs/react-menu';

const menuKey = new PluginKey('menuKey');

export default function Editor() {
  const editorState = useEditorState({
    plugins: () => [
      ...corePlugins(),
      floatingMenu.plugins({
        key: menuKey,
      }),
    ],
    initialValue: 'hi there',
  });

  return (
    <BangleEditorView state={editorState}>
      <FloatingMenu menuKey={menuKey} />
    </BangleEditorView>
  );
}
