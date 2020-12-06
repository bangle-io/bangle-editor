import '@banglejs/core/style.css';
import '@banglejs/tooltip/style.css';
import '@banglejs/react-menu/style.css';

import React from 'react';
import { ReactEditor } from '@banglejs/react';
import { PluginKey } from '@banglejs/core';
import { SpecRegistry } from '@banglejs/core/spec-registry';
import { corePlugins } from '@banglejs/core/utils/core-components';
import { floatingMenu, FloatingMenu } from '@banglejs/react-menu';

const menuKey = new PluginKey('menuKey');
const specRegistry = new SpecRegistry();
const plugins = [
  ...corePlugins(),
  floatingMenu.plugins({
    key: menuKey,
  }),
];

export default function Editor() {
  return (
    <ReactEditor
      options={{
        specRegistry,
        plugins,
        stateOpts: {
          content: 'Try selection me.',
        },
      }}
    >
      <FloatingMenu menuKey={menuKey} />
    </ReactEditor>
  );
}
