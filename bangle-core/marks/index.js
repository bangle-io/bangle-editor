import * as bold from './bold';
import * as code from './code';
import * as italic from './italic';
import * as link from './link';
import * as strike from './strike';
import * as underline from './underline';

export * as bold from './bold';
export * as code from './code';
export * as italic from './italic';
export * as link from './link';
export * as strike from './strike';
export * as underline from './underline';

export function coreMarkSpec(options = {}) {
  return [
    bold.spec(options.bold),
    code.spec(options.code),
    italic.spec(options.italic),
    strike.spec(options.strike),
    link.spec(options.link),
    underline.spec(options.underline),
  ];
}

export function coreMarkPlugins(options = {}) {
  return [
    bold.plugins(options.bold),
    code.plugins(options.code),
    italic.plugins(options.italic),
    strike.plugins(options.strike),
    link.plugins(options.link),
    underline.plugins(options.underline),
  ];
}
