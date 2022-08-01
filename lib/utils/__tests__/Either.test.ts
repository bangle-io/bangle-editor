// Not sure why eslint is not able to figure this one out
// eslint-disable-next-line import/no-unresolved
import { expectType } from 'tsd';

import { Either, Left, Right } from '../src/Either';

describe('left', () => {
  let either = getMeValue(true, 'hello', 7);

  test('resolve works', () => {
    expectType<[string, undefined] | [undefined, number]>(
      Either.unwrap(either),
    );
    expect(Either.unwrap(either)).toEqual(['hello', undefined]);
  });

  test('map works', () => {
    let e = Either.map(either, (num) => num + 1);

    expectType<Left<string> | Right<number>>(e);
    expect(Either.unwrap(e)).toEqual(['hello', undefined]);

    let result = [];
    if (Either.isLeft(e)) {
      expectType<string>(e.left);
      expectType<undefined>(e.right);
      result.push(e.left);
      result.push(e.right);
    }
    if (Either.isRight(e)) {
      expectType<undefined>(e.left);
      expectType<number>(e.right);
      result.push(e.left);
      result.push(e.right);
    }

    expect(result).toEqual(['hello', undefined]);
  });

  test('mapLeft works', () => {
    let e = Either.mapLeft(either, (word) => word + 'world');

    expectType<Left<string> | Right<number>>(e);
    expect(Either.unwrap(e)).toEqual(['helloworld', undefined]);

    let result = [];
    if (Either.isLeft(e)) {
      expectType<string>(e.left);
      expectType<undefined>(e.right);
      result.push(e.left);
      result.push(e.right);
    }
    if (Either.isRight(e)) {
      expectType<undefined>(e.left);
      expectType<number>(e.right);
      result.push(e.left);
      result.push(e.right);
    }

    expect(result).toEqual(['helloworld', undefined]);
  });
});

describe('right', () => {
  let either = getMeValue(false, 'hello', 7);

  test('resolve works', () => {
    expectType<[string, undefined] | [undefined, number]>(
      Either.unwrap(either),
    );
    expect(Either.unwrap(either)).toEqual([undefined, 7]);
  });

  test('map works', () => {
    let e = Either.map(either, (num) => num + 1);

    expectType<Left<string> | Right<number>>(e);
    expect(Either.unwrap(e)).toEqual([undefined, 8]);

    let result = [];
    if (Either.isLeft(e)) {
      expectType<string>(e.left);
      expectType<undefined>(e.right);
      result.push(e.left);
      result.push(e.right);
    }
    if (Either.isRight(e)) {
      expectType<undefined>(e.left);
      expectType<number>(e.right);
      result.push(e.left);
      result.push(e.right);
    }

    expect(result).toEqual([undefined, 8]);
  });

  test('mapLeft works', () => {
    let e = Either.mapLeft(either, (word) => word + 'world');

    expectType<Left<string> | Right<number>>(e);
    expect(Either.unwrap(e)).toEqual([undefined, 7]);

    let result = [];
    if (Either.isLeft(e)) {
      expectType<string>(e.left);
      expectType<undefined>(e.right);
      result.push(e.left);
      result.push(e.right);
    }
    if (Either.isRight(e)) {
      expectType<undefined>(e.left);
      expectType<number>(e.right);
      result.push(e.left);
      result.push(e.right);
    }

    expect(result).toEqual([undefined, 7]);
  });

  test('flatMap works', () => {
    let either = getMeValue(false, 'hello', 7);

    let newEither = Either.flatMap(either, (num) => Either.right(num + 1));

    expectType<Left<string> | Right<number>>(newEither);

    expect(Either.value(newEither)).toEqual(8);
  });

  test('flatMap type change', () => {
    let either = getMeValue(false, 'hello', 7);

    let newEither = Either.flatMap(either, (num) => Either.right(false));

    expectType<Left<string> | Right<boolean>>(newEither);

    expect(Either.value(newEither)).toEqual(false);
  });

  test('flatMap to left works', () => {
    let either = getMeValue(false, 'hello', 7);

    const errorEither = Either.flatMap(either, (num, { left }) =>
      left('error'),
    );

    expectType<Left<string> | Right<number>>(errorEither);

    expect(Either.value(errorEither)).toEqual('error');
  });
});

test('Works', () => {
  let result = getMeValue(true, 'hello', 8);

  expect(Either.unwrap(result)).toEqual(['hello', undefined]);
});

test('Map works', () => {
  let result = getMeValue(true, 'hello', 8);

  expect(Either.unwrap(Either.map(result, (value) => value + 1))).toEqual([
    'hello',
    undefined,
  ]);

  expect(
    Either.unwrap(
      Either.mapLeft(
        Either.map(
          Either.mapLeft(result, (left) => left.toLocaleUpperCase()),
          (right) => right + 5,
        ),
        (left) => left + 'test',
      ),
    ),
  ).toEqual(['HELLOtest', undefined]);
});

test('getLeft works', () => {
  let either = getMeValue(true, 5, 'world');

  Either.map(either, (value) => {
    expectType<string>(value);
    return value + 'world';
  });

  Either.mapLeft(either, (value) => {
    expectType<number>(value);
    return value + 1;
  });

  let values = [];
  if (Either.isLeft(either)) {
    let target = either.left;
    expectType<number>(target);
    expectType<undefined>(either.right);
    values.push(target);
  } else if (Either.isRight(either)) {
    let target = either.right;
    expectType<string>(target);
    expectType<undefined>(either.left);
    values.push(target);
  }

  expect(values).toEqual([5]);
});

test('getRight works', () => {
  let either = getMeValue(false, 5, 'world');

  expectType<string | number>(Either.value(either));

  let values = [];
  if (Either.isLeft(either)) {
    let target = either.left;
    expectType<number>(target);

    values.push(target);
  } else if (Either.isRight(either)) {
    let target = either.right;
    expectType<string>(target);
    values.push(target);
  }

  expect(values).toEqual(['world']);
});

test('fold works', () => {
  function makeEither(
    isLeft: boolean,
  ): Left<{ error: string }> | Right<{ type: string; value: number }> {
    return isLeft
      ? Either.left({ error: 'hi' })
      : Either.right({ type: 'hi', value: 5 });
  }

  let either = makeEither(true);

  let newEither = Either.fold(
    either,
    (left) => {
      expectType<{ error: string }>(left);
      return {
        error: 'world',
      };
    },
    (right) => {
      expectType<{ type: string; value: number }>(right);
      return right.value;
    },
  );

  expect(Either.unwrap(newEither)).toEqual([{ error: 'world' }, undefined]);
});

function getMeValue<L, R>(isLeft: boolean, left: L, right: R) {
  return isLeft ? Either.left(left) : Either.right(right);
}
