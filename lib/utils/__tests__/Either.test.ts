import { expectType } from 'tsd';

import { Either, EitherBase, Left, Right } from '../src/Either';

describe('left', () => {
  let either = Left<string, number>('hello');

  test('resolve works', () => {
    expectType<[string, undefined] | [undefined, number]>(either.resolve());
    expect(either.resolve()).toEqual(['hello', undefined]);
  });

  test('map works', () => {
    let e = either.map((num) => num + 1);

    expectType<EitherBase<string, number>>(e);
    expect(e.resolve()).toEqual(['hello', undefined]);

    let result = [];
    if (e.isLeft()) {
      expectType<string>(e.left);
      expectType<undefined>(e.right);
      result.push(e.left);
      result.push(e.right);
    }
    if (e.isRight()) {
      expectType<undefined>(e.left);
      expectType<number>(e.right);
      result.push(e.left);
      result.push(e.right);
    }

    expect(result).toEqual(['hello', undefined]);
  });

  test('mapLeft works', () => {
    let e = either.mapLeft((word) => word + 'world');

    expectType<EitherBase<string, number>>(e);
    expect(e.resolve()).toEqual(['helloworld', undefined]);

    let result = [];
    if (e.isLeft()) {
      expectType<string>(e.left);
      expectType<undefined>(e.right);
      result.push(e.left);
      result.push(e.right);
    }
    if (e.isRight()) {
      expectType<undefined>(e.left);
      expectType<number>(e.right);
      result.push(e.left);
      result.push(e.right);
    }

    expect(result).toEqual(['helloworld', undefined]);
  });
});

describe('right', () => {
  let either = Right<string, number>(7);

  test('resolve works', () => {
    expectType<[string, undefined] | [undefined, number]>(either.resolve());
    expect(either.resolve()).toEqual([undefined, 7]);
  });

  test('map works', () => {
    let e = either.map((num) => num + 1);

    expectType<EitherBase<string, number>>(e);
    expect(e.resolve()).toEqual([undefined, 8]);

    let result = [];
    if (e.isLeft()) {
      expectType<string>(e.left);
      expectType<undefined>(e.right);
      result.push(e.left);
      result.push(e.right);
    }
    if (e.isRight()) {
      expectType<undefined>(e.left);
      expectType<number>(e.right);
      result.push(e.left);
      result.push(e.right);
    }

    expect(result).toEqual([undefined, 8]);
  });

  test('mapLeft works', () => {
    let e = either.mapLeft((word) => word + 'world');

    expectType<EitherBase<string, number>>(e);
    expect(e.resolve()).toEqual([undefined, 7]);

    let result = [];
    if (e.isLeft()) {
      expectType<string>(e.left);
      expectType<undefined>(e.right);
      result.push(e.left);
      result.push(e.right);
    }
    if (e.isRight()) {
      expectType<undefined>(e.left);
      expectType<number>(e.right);
      result.push(e.left);
      result.push(e.right);
    }

    expect(result).toEqual([undefined, 7]);
  });
});

test('Works', () => {
  let result = Left('hello');

  expect(result.resolve()).toEqual(['hello', undefined]);
});

test('Map works', () => {
  let result = Left<string, never>('hello');

  expect(result.map((value) => value + 1).resolve()).toEqual([
    'hello',
    undefined,
  ]);

  expect(
    result
      .mapLeft((left) => left.toLocaleUpperCase())
      .map((right) => right + 5)
      .mapLeft((left) => left + 'test')
      .resolve(),
  ).toEqual(['HELLOtest', undefined]);
});

test('getLeft works', () => {
  let either = getMeValue(true);

  either.map((value) => {
    expectType<string>(value);
    return value + 1;
  });

  either.mapLeft((value) => {
    expectType<number>(value);
    return value + 1;
  });

  let values = [];
  if (either.isLeft()) {
    let target = either.left;
    expectType<number>(target);
    expectType<undefined>(either.right);
    values.push(target);
  } else if (either.isRight()) {
    let target = either.right;
    expectType<string>(target);
    expectType<undefined>(either.left);
    values.push(target);
  }

  expect(values).toEqual([5]);
});

test('getRight works', () => {
  let either = getMeValue(false);
  expectType<string | number>(either.value);

  let values = [];
  if (either.isLeft()) {
    let target = either.left;
    expectType<number>(target);
    expectType<number>(either.value);

    values.push(target);
  } else if (either.isRight()) {
    let target = either.right;
    expectType<string>(either.value);
    expectType<string>(target);
    values.push(target);
  }

  expect(values).toEqual(['world']);
});

test('fold works', () => {
  function makeEither(
    isLeft: boolean,
  ): Either<{ error: string }, { type: string; value: number }> {
    return isLeft ? Left({ error: 'hi' }) : Right({ type: 'hi', value: 5 });
  }

  let either = makeEither(true);

  let newEither = either.fold(
    (left) => {
      expectType<{ error: string }>(left);
      return left.error;
    },
    (right) => {
      expectType<{ type: string; value: number }>(right);
      return right.value;
    },
  );

  expect(newEither.resolve()).toEqual(['hi', undefined]);
});

test('resolve works', () => {
  let either = getMeValue(true);

  let resolve = either.resolve();

  expectType<[number, undefined] | [undefined, string]>(resolve);

  let result = [];
  if (either.isLeft()) {
    result.push(either.resolve());

    expectType<[number, undefined]>(either.resolve());
  }

  if (either.isRight()) {
    result.push(either.resolve());
    expectType<[undefined, string]>(either.resolve());
  }

  expect(result).toEqual([[5, undefined]]);
});

function getMeValue(isLeft: boolean): Either<number, string> {
  return isLeft ? Left(5) : Right('world');
}
