import React from 'react';

import { defaultPlugins, defaultSpecs } from '@bangle.dev/all-base-components';
import { NodeViewProps, PluginKey, SpecRegistry } from '@bangle.dev/core';
import { FloatingMenu, floatingMenu } from '@bangle.dev/react-menu';
import { sticker } from '@bangle.dev/react-sticker';

import { setupReactEditor, win } from '../../setup/entry-helpers';

export default function setup() {
  win.commands = {
    floatingMenu: floatingMenu.commands,
    sticker: sticker.commands,
  };

  win.floatMenuKey = new PluginKey('floatingmenukey');

  const renderNodeViews = ({ node, ...args }: NodeViewProps) => {
    if (node.type.name === 'sticker') {
      return <sticker.Sticker node={node} {...args} />;
    }
    return undefined;
  };

  const specRegistry = new SpecRegistry([...defaultSpecs(), sticker.spec()]);
  const plugins = () => [
    ...defaultPlugins(),
    sticker.plugins(),
    floatingMenu.plugins({
      key: win.floatMenuKey,
    }),
  ];

  setupReactEditor({
    children: React.createElement(FloatingMenu, {
      menuKey: win.floatMenuKey,
    }),
    specRegistry,
    plugins,
    renderNodeViews,
    id: 'pm-root',
  });
}
