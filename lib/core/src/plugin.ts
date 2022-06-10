import { Plugin, PluginKey } from '@bangle.dev/pm';

export { Plugin, PluginKey };

interface DeepPluginArray extends Array<Plugin | DeepPluginArray> {}

export class PluginGroup {
  constructor(public name: string, public plugins: DeepPluginArray) {}
}
