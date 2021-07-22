import { Plugin, PluginKey } from '@bangle.dev/pm';

export { Plugin, PluginKey };
export class PluginGroup {
  constructor(public name: string, public plugins: Plugin[]) {}
}
