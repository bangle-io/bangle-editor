import { Plugin, PluginKey } from 'prosemirror-state';
export { Plugin, PluginKey };

export class PluginGroup {
  constructor(public name: string, public plugins: Plugin[]) {}
}
