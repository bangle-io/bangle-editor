import '../setup/entry.css';
import { setupReactEditor } from '../setup/entry-helpers';
setup();

function setup() {
  window.commands = {};

  setupReactEditor({
    id: 'pm-root',
  });
}
