import { compose } from 'lodash/fp';

export function schemaCompose(...schemaFuncs) {
  return compose(...schemaFuncs);
}
