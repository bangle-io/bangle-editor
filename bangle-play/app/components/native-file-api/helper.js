import { NoPermissionError } from './errors';

export function iterateIndexDb(indexDb) {
  const result = [];
  return indexDb
    .iterate((value, key, iterationNumber) => {
      result.push({ key, value });
    })
    .then(() => {
      return result;
    });
}
