/**
 * @jest-environment jsdom
 */

import {
  matchAllPlus,
  serialExecuteQueue,
  simpleLRU,
  sleep,
} from '../src/js-utils';

describe('matchAllPlus', () => {
  const mergeStartEnd = (str, result) =>
    result.reduce((prev, cur) => prev + str.slice(cur.start, cur.end), '');

  const mergeSubstrings = (str, result) =>
    result.reduce((prev, cur) => prev + cur.subString, '');

  test('works when match', () => {
    const result = matchAllPlus(/foo[a-z]*/g, 'baseball  foozball');
    expect(result.map((r) => r.subString)).toMatchInlineSnapshot(`
        Array [
          "baseball  ",
          "foozball",
        ]
      `);
    expect(result.map((r) => ({ ...r }))).toMatchSnapshot();
  });

  test('works when direct match', () => {
    const result = matchAllPlus(/foo[a-z]*/g, 'foozball');
    expect(result.map((r) => r.subString)).toMatchInlineSnapshot(`
        Array [
          "foozball",
        ]
      `);
    expect(result.map((r) => ({ ...r }))).toMatchSnapshot();
  });

  test('works when no match', () => {
    const result = matchAllPlus(/foo[a-z]*/g, 'baseball  boozball');
    expect(result.map((r) => r.subString)).toMatchInlineSnapshot(`
        Array [
          "baseball  boozball",
        ]
      `);
    expect(result.every((r) => r.match === false)).toBe(true);
    expect(result.map((r) => ({ ...r }))).toMatchSnapshot();
  });

  test('works with multiple matches 1', () => {
    let result = matchAllPlus(
      /foo[a-z]*/g,
      'baseball  football foosball gobhi',
    );
    expect(result.map((r) => r.subString)).toMatchInlineSnapshot(`
        Array [
          "baseball  ",
          "football",
          " ",
          "foosball",
          " gobhi",
        ]
      `);
  });

  test('works with multiple matches 2', () => {
    const result = matchAllPlus(
      /foo[a-z]*/g,
      'baseball  football gobhi tamatar foosball',
    );
    expect(result.map((r) => r.subString)).toMatchInlineSnapshot(`
        Array [
          "baseball  ",
          "football",
          " gobhi tamatar ",
          "foosball",
        ]
      `);
    expect(result.map((r) => r.match)).toMatchInlineSnapshot(`
        Array [
          false,
          true,
          false,
          true,
        ]
      `);
  });

  test.each([
    ['hello https://google.com two https://bangle.io', 2],
    ['hello https://google.com https://bangle.io', 2],
    ['https://google.com https://bangle.io', 2],
    ['https://google.com t https://bangle.io ', 2],
    ['https://google.com 🙆‍♀️ https://bangle.io 👯‍♀️', 2],
    ['hello https://google.com two s', 1],
    ["hello https://google.com'", 1],
    ["hello https://google.com' two", 1],
  ])(
    '%# string start and end positions should be correct',
    (string, matchCount) => {
      const result = matchAllPlus(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-zA-Z]{2,}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g,
        string,
      );

      expect(result.filter((r) => r.match)).toHaveLength(matchCount);

      expect(mergeStartEnd(string, result)).toBe(string);
    },
  );

  test('1 misc cases', () => {
    const regex = /t(e)(st(\d?))/g;
    const string = 'test1test2';
    const result = matchAllPlus(regex, string);

    expect(mergeStartEnd(string, result)).toBe(string);
    expect(mergeSubstrings(string, result)).toBe(string);

    expect(result).toMatchInlineSnapshot(`
      Array [
        MatchType {
          "_sourceString": "test1test2",
          "end": 5,
          "match": true,
          "start": 0,
        },
        MatchType {
          "_sourceString": "test1test2",
          "end": 10,
          "match": true,
          "start": 5,
        },
      ]
    `);
  });

  test('2 misc cases', () => {
    const regex = /(#\w+)/g;
    const string = 'Hello #world #planet!';
    const result = matchAllPlus(regex, string);
    expect(mergeStartEnd(string, result)).toBe(string);

    expect(result).toMatchInlineSnapshot(`
      Array [
        MatchType {
          "_sourceString": "Hello #world #planet!",
          "end": 6,
          "match": false,
          "start": 0,
        },
        MatchType {
          "_sourceString": "Hello #world #planet!",
          "end": 12,
          "match": true,
          "start": 6,
        },
        MatchType {
          "_sourceString": "Hello #world #planet!",
          "end": 13,
          "match": false,
          "start": 12,
        },
        MatchType {
          "_sourceString": "Hello #world #planet!",
          "end": 20,
          "match": true,
          "start": 13,
        },
        MatchType {
          "_sourceString": "Hello #world #planet!",
          "end": 21,
          "match": false,
          "start": 20,
        },
      ]
    `);
  });
});

describe('serialExecuteQueue', () => {
  test('works sequentially for sync callbacks', async () => {
    expect.assertions(11);
    const q = serialExecuteQueue();
    let counter = 0;
    const result = await Promise.all(
      Array.from({ length: 10 }, (_, k) =>
        q.add(() => {
          expect(counter++).toBe(k);
          return k;
        }),
      ),
    );
    expect(result).toEqual(Array.from({ length: 10 }, (_, k) => k));
  });

  test('works sequentially for async callbacks 1', async () => {
    expect.assertions(11);
    const q = serialExecuteQueue();
    let counter = 0;
    const result = await Promise.all(
      Array.from({ length: 10 }, (_, k) =>
        q.add(() => {
          expect(counter++).toBe(k);
          return Promise.resolve(k);
        }),
      ),
    );
    expect(result).toEqual(Array.from({ length: 10 }, (_, k) => k));
  });

  test('works sequentially for async callbacks 2', async () => {
    expect.assertions(11);
    const q = serialExecuteQueue();
    let counter = 0;
    const result = await Promise.all(
      Array.from({ length: 10 }, (_, k) =>
        q.add(async () => {
          await sleep((10 - k) * 10);
          expect(counter++).toBe(k);
          return Promise.resolve(k);
        }),
      ),
    );
    expect(result).toEqual(Array.from({ length: 10 }, (_, k) => k));
  });

  test('Older items block newer executions', async () => {
    const q = serialExecuteQueue();
    let result = [];
    await q.add(async () => {
      await sleep(1);
      result.push('🦆');
    });

    q.add(async () => {
      await sleep(400); // <== slow item
      result.push('🐌');
    });

    await q.add(async () => {
      await sleep(1);
      result.push('🐅');
    });
    expect(result).toEqual(['🦆', '🐌', '🐅']);
  });

  test('error throwing doesnt affect newer items', async () => {
    const q = serialExecuteQueue();
    let result = [];
    await q.add(async () => {
      await sleep(1);
      result.push('🦆');
    });

    await expect(
      q.add(async () => {
        await sleep(140); // <== slow item
        return Promise.reject('I borke');
      }),
    ).rejects.toMatchInlineSnapshot(`"I borke"`);

    expect(
      await q.add(async () => {
        await sleep(1);
        result.push('🐅');
        return '🐅';
      }),
    ).toBe('🐅');

    expect(result).toEqual(['🦆', '🐅']);
  });

  test('error throwing doesnt affect last item', async () => {
    const q = serialExecuteQueue();
    let result = [];
    await expect(
      q.add(async () => {
        await sleep(100);
        return Promise.reject('I borke 1');
      }),
    ).rejects.toMatchInlineSnapshot(`"I borke 1"`);

    await expect(
      q.add(async () => {
        await sleep(1); // <== slow item
        return Promise.reject('I borke 2');
      }),
    ).rejects.toMatchInlineSnapshot(`"I borke 2"`);

    expect(
      await q.add(async () => {
        await sleep(1);
        result.push('🐅');
        return '🐅';
      }),
    ).toBe('🐅');

    await q.add(async () => {
      await sleep(40); // <== slow item
      result.push('🐌');
    });

    expect(result).toEqual(['🐅', '🐌']);
  });
});

describe('Simple LRU', () => {
  test('Pushed item in the LRU', () => {
    let lru = simpleLRU(3);
    lru.set('one', 1);
    lru.set('two', 2);
    lru.set('three', 3);
    expect(lru.entries()).toMatchInlineSnapshot(`
        Array [
          Object {
            "key": "one",
            "value": 1,
          },
          Object {
            "key": "two",
            "value": 2,
          },
          Object {
            "key": "three",
            "value": 3,
          },
        ]
      `);
  });

  test('Retreiving item makes it recently used', () => {
    let lru = simpleLRU(3);
    lru.set('one', 1);
    lru.set('two', 2);
    lru.set('three', 3);
    expect(lru.get('one')).toBe(1);

    let result = lru.entries();
    expect(result).toHaveLength(3);
    expect(result[result.length - 1]).toEqual({
      key: 'one',
      value: 1,
    });
  });

  test('Clears item correct', () => {
    let lru = simpleLRU(3);
    lru.set('one', 1);
    lru.set('two', 2);
    lru.set('three', 3);
    lru.get('one', 1);
    lru.set('four', 4);
    expect(lru.get('two')).toBe(undefined);

    let result = lru.entries();
    expect(result).toHaveLength(3);

    expect(lru.entries()).toMatchInlineSnapshot(`
        Array [
          Object {
            "key": "three",
            "value": 3,
          },
          Object {
            "key": "one",
            "value": 1,
          },
          Object {
            "key": "four",
            "value": 4,
          },
        ]
      `);
  });
});
