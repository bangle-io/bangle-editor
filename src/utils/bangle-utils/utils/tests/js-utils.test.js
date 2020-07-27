import { matchAllPlus } from '../js-utils';

describe('matchAllPlus', () => {
  test('works when match', () => {
    const result = matchAllPlus(/foo[a-z]*/g, 'baseball  foozball');
    expect(result.map((r) => r.matchedStr)).toMatchInlineSnapshot(`
      Array [
        "baseball  ",
        "foozball",
      ]
    `);
    expect(result).toMatchSnapshot();
  });

  test('works when direct match', () => {
    const result = matchAllPlus(/foo[a-z]*/g, 'foozball');
    expect(result.map((r) => r.matchedStr)).toMatchInlineSnapshot(`
      Array [
        "foozball",
      ]
    `);
    expect(result).toMatchSnapshot();
  });

  test('works when no match', () => {
    const result = matchAllPlus(/foo[a-z]*/g, 'baseball  boozball');
    expect(result.map((r) => r.matchedStr)).toMatchInlineSnapshot(`
      Array [
        "baseball  boozball",
      ]
    `);
    expect(result.every((r) => r.match === false)).toBe(true);
    expect(result).toMatchSnapshot();
  });

  test('works with multiple matches', () => {
    let result = matchAllPlus(
      /foo[a-z]*/g,
      'baseball  football foosball gobhi',
    );
    expect(result.map((r) => r.matchedStr)).toMatchInlineSnapshot(`
      Array [
        "baseball  ",
        "football",
        " ",
        "foosball",
        "gobhi",
      ]
    `);
  });

  test('works with multiple matches', () => {
    const result = matchAllPlus(
      /foo[a-z]*/g,
      'baseball  football gobhi tamatar foosball',
    );
    expect(result.map((r) => r.matchedStr)).toMatchInlineSnapshot(`
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
});
