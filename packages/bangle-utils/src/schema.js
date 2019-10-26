import { compose } from 'ramda';

export function schemaCompose(...schemaFuncs) {
  return compose(...schemaFuncs);
}
