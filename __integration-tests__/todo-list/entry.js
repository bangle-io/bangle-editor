import '../setup/entry.css';
import { defaultPlugins } from '@bangle.dev/core/test-helpers/default-components';
import * as prosemirrorView from '@bangle.dev/core/prosemirror/view';
import { setupReactEditor } from '../setup/entry-helpers';

window.prosemirrorView = prosemirrorView;

setup();

function setup() {
  window.commands = {};

  const plugins = () => [...defaultPlugins()];

  setupReactEditor({ id: 'pm-root', plugins });
}
