import '../setup/entry.css';
import React from 'react';
import {
  defaultPlugins,
  defaultSpecs,
} from '@bangle.dev/core/test-helpers/default-components';
import { SpecRegistry } from '@bangle.dev/core/spec-registry';
import { sticker } from '@bangle.dev/react-sticker';
import { setupReactEditor } from '../setup/entry-helpers';
import { floatingMenu } from '@bangle.dev/react-menu';
import { PluginKey } from '@bangle.dev/core/index';

setup();

function setup() {
  window.commands = {
    floatingMenu: floatingMenu.commands,
    sticker: sticker.commands,
  };

  window.floatMenuKey = new PluginKey('floatingmenukey');

  const renderNodeViews = ({ node, ...args }) => {
    if (node.type.name === 'sticker') {
      return <sticker.Sticker node={node} {...args} />;
    }
  };

  const specRegistry = new SpecRegistry([...defaultSpecs(), sticker.spec()]);
  const plugins = () => [
    ...defaultPlugins(),
    sticker.plugins(),
    floatingMenu.plugins({
      key: window.floatMenuKey,
    }),
  ];

  setupReactEditor({ specRegistry, plugins, renderNodeViews, id: 'pm-root' });
}
