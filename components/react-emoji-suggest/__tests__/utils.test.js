import { jumpRow, resolveCounter } from '../utils';

function getItem(namedGroup, coords) {
  return namedGroup[coords[0]].emojis[coords[1]];
}

// helper function to create groups in to namedGroups
const c = (groups) => groups.map((g, i) => ({ name: 'group-' + i, emojis: g }));

describe('resolveCounter', () => {
  test('1 works', () => {
    const result = resolveCounter(
      3,
      c([
        ['a', 'b', 'c'],
        ['d', 'e'],
      ]),
    );
    expect(result.item).toEqual('d');
  });

  test('2 works', () => {
    const result = resolveCounter(
      2,
      c([
        ['a', 'b', 'c'],
        ['d', 'e'],
      ]),
    );
    expect(result.item).toEqual('c');
  });

  test('3 works', () => {
    const result = resolveCounter(
      1,
      c([
        ['a', 'b', 'c'],
        ['d', 'e'],
      ]),
    );
    expect(result.item).toEqual('b');
  });

  test('4 works', () => {
    const result = resolveCounter(
      0,
      c([
        ['a', 'b', 'c'],
        ['d', 'e'],
      ]),
    );
    expect(result.item).toEqual('a');
  });

  test('5 works', () => {
    const result = resolveCounter(
      -1,
      c([
        ['a', 'b', 'c'],
        ['d', 'e'],
      ]),
    );
    expect(result.item).toEqual('e');
  });

  test('6 works', () => {
    const result = resolveCounter(
      -2,
      c([
        ['a', 'b', 'c'],
        ['d', 'e'],
      ]),
    );
    expect(result.item).toEqual('d');
  });

  test('7 works', () => {
    const result = resolveCounter(
      -3,
      c([
        ['a', 'b', 'c'],
        ['d', 'e'],
      ]),
    );
    expect(result.item).toEqual('c');
  });

  test('8 works', () => {
    const result = resolveCounter(
      -6,
      c([
        ['a', 'b', 'c'],
        ['d', 'e'],
      ]),
    );
    expect(result.item).toEqual('e');
  });

  test('9 works', () => {
    const data = c([
      ['a', 'b', 'c'],
      ['d', 'e'],
      ['f', 'g'],
      ['h', 'i', 'j', 'k'],
    ]);
    expect(resolveCounter(6, data).item).toEqual('g');
    // 11 is the total size of data
    expect(resolveCounter(6 - 11, data).item).toEqual('g');
    expect(resolveCounter(6 + 11, data).item).toEqual('g');
    expect(resolveCounter(7, data).item).toEqual('h');
    expect(resolveCounter(7 + 11, data).item).toEqual('h');
    expect(resolveCounter(7 - 11, data).item).toEqual('h');
  });

  test('empty works', () => {
    const result = resolveCounter(-6, []);
    expect(result.item).toEqual(undefined);
  });

  test('2 empty works', () => {
    const data = c([[], ['a', 'b', 'c']]);
    expect(resolveCounter(0, data).item).toEqual('a');
    expect(resolveCounter(1, data).item).toEqual('b');
    expect(resolveCounter(3, data).item).toEqual('a');
  });
});

describe('jumpRow', () => {
  test('1. going up group gives the last item', () => {
    // prettier-ignore
    const data = c([
      ['a', 'b', 'c', 'd'],
      ['e', 'f', 'g'],
      ['i', 'j', 'k', 'l', 'm'],
      ]);
    const counter = 8;
    expect(resolveCounter(counter, data).item).toBe('j');
    let result = jumpRow(counter, -1, 5, data);
    expect(result.item).toBe('g');
    expect(getItem(data, result.coords)).toBe('g');
  });

  test('2. going up group gives the last item', () => {
    // prettier-ignore
    const data = c([
      ['a', 'b', 'c', 'd'],
      ['e', 'f', 'g'],
      ['i', 'j', 'k', 'l', 'm'],
      ]);
    const counter = 6;
    expect(resolveCounter(counter, data).item).toBe('g');
    let result = jumpRow(counter, -1, 5, data);
    expect(result.item).toBe('d');
    expect(getItem(data, result.coords)).toBe('d');
  });

  test('2. going up within group gives correct item', () => {
    // prettier-ignore
    const data = c([
      ['a', 'b', 'c', 'd'],
      ['e', 'f', 'g'],
      ['i', 'j', 'k', 'l', 'm',
       'n'
      ]]);
    const counter = 12;
    expect(resolveCounter(counter, data).item).toBe('n');
    let result = jumpRow(counter, -1, 5, data);
    expect(result.item).toBe('i');
    expect(getItem(data, result.coords)).toBe('i');
  });

  test('4. going up within group gives correct item', () => {
    // prettier-ignore
    const data = c([
      ['a', 'b', 'c', 'd'],
      ['e', 'f', 'g'],
      ['i', 'j', 'k', 'l', 'm',
       'n', 'o', 'p'
      ]]);
    const counter = 13;
    expect(resolveCounter(counter, data).item).toBe('o');
    let result = jumpRow(counter, -1, 5, data);
    expect(result.item).toBe('j');
    expect(getItem(data, result.coords)).toBe('j');
  });

  test('1. going down group gives the first item', () => {
    // prettier-ignore
    const data = c([
      ['a', 'b', 'c', 'd'],
      ['e', 'f', 'g'],
      ['i', 'j', 'k', 'l', 'm'],
      ]);
    let counter = 8;
    expect(resolveCounter(counter, data).item).toBe('j');
    let result = jumpRow(counter, 1, 5, data);
    expect(result.item).toBe('a');
    expect(getItem(data, result.coords)).toBe('a');
  });

  test('2. going down group gives the first item', () => {
    // prettier-ignore
    const data = c([
      ['a', 'b', 'c', 'd'],
      ['e', 'f', 'g'],
      ['i', 'j', 'k', 'l', 'm'],
      ]);
    let counter = 7;
    expect(resolveCounter(counter, data).item).toBe('i');
    let result = jumpRow(counter, 1, 5, data);
    expect(result.item).toBe('a');
    expect(getItem(data, result.coords)).toBe('a');
  });

  test('1. going down within group gives correct item', () => {
    // prettier-ignore
    const data = c([
      ['a', 'b', 'c', 'd'],
      ['e', 'f', 'g'],
      ['i', 'j', 'k', 'l', 'm',
       'n', 'o', 'p'
      ],
      ]);
    const counter = 8;
    expect(resolveCounter(counter, data).item).toBe('j');
    let result = jumpRow(counter, 1, 5, data);
    expect(result.item).toBe('o');
    expect(getItem(data, result.coords)).toBe('o');
  });

  test('going down single item arrays', () => {
    // prettier-ignore
    const data = c([
      ['a'], ['b'], ['c'], ['d'],
      ]);

    let counter = 0;
    expect(resolveCounter(counter, data).item).toBe('a');
    let result = jumpRow(counter, 1, 4, data);
    expect(result.item).toBe('b');
    expect(getItem(data, result.coords)).toBe('b');

    result = jumpRow(++counter, 1, 4, data);
    expect(result.item).toBe('c');

    result = jumpRow(++counter, 1, 4, data);
    expect(result.item).toBe('d');

    result = jumpRow(++counter, 1, 4, data);
    expect(result.item).toBe('a');
  });
});
