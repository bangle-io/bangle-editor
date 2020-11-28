import '../setup/entry.css';
import { defaultPlugins } from 'bangle-core/test-helpers/default-components';
import * as prosemirrorView from 'bangle-core/pm-view';
import { setupReactEditor } from '../setup/entry-helpers';
import { trailingNode } from 'bangle-plugins/trailing-node/index';

window.prosemirrorView = prosemirrorView;

setup();

function setup() {
  window.commands = {};

  const plugins = [...defaultPlugins()];

  setupReactEditor({ id: 'pm-root', plugins });
}
