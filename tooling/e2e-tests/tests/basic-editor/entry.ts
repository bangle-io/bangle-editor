import { setupReactEditor, win } from '../../setup/entry-helpers';

export default function setup() {
  win.commands = {};

  setupReactEditor({ id: 'pm-root' });
}
