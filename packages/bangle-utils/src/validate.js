import v from '@mapbox/fusspot';
import { negate } from 'lodash';
import isPlainObject from 'is-plain-obj';

// A non error throwing validator
// copied and from fusspot's v.assert
export const validate = negate(function(validationObject, value) {
  if (!isPlainObject(validationObject)) {
    throw new Error('must be plan object');
  }

  const validator = v.shape(validationObject);
  if (value == null && !validator.hasOwnProperty('__required')) {
    return;
  }
  var result = validator(value);

  if (result) {
    return Array.isArray(result) ? result : [result];
  }
});
