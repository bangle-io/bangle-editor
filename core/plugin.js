import { Plugin, PluginKey } from './prosemirror/state';
export { Plugin, PluginKey };

export class PluginGroup {
  constructor(name, plugins) {
    this.name = name;
    this.plugins = plugins;
  }
}
