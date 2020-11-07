import * as dinos from './dinos/index';

export * as dinos from './dinos/index';

export const spec = (opts = {}) => {
  return [dinos.spec(opts.dinos)];
};

export const plugins = (opts = {}) => {
  return [dinos.plugins(opts.dinos)];
};

export const commands = {
  dinos: dinos.commands,
};
