import { coreMarkPlugins, coreMarkSpec } from './marks/index';
import { coreNodeSpec, coreNodePlugins } from './nodes/index';
import * as history from './extensions/history';

export * from './nodes/index';
export * from './marks/index';
export * as history from './extensions/history';

export function coreSpec(opts = {}) {
  return [
    ...coreMarkSpec(opts.node),
    ...coreNodeSpec(opts.node),
    history.spec(opts.history),
  ];
}

export function corePlugins(opts = {}) {
  return [
    ...coreMarkPlugins(opts.node),
    ...coreNodePlugins(opts.node),
    history.plugins(opts.history),
  ];
}
