export { Plugin, PluginKey } from 'prosemirror-state';

export class PluginGroup {
  constructor(name, plugins) {
    this.name = name;
    this.plugins = plugins;
  }
}
