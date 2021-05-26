import { sum } from '../index';
/* eslint-disable no-process-env */
const v = process.env.NODE_ENV;

describe('summation', () => {
  test('works', () => {
    expect(sum(1, 2)).toBe(3);
  });
});
