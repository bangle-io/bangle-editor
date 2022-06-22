// export enum MaybeType {
//   Just = 'just',
//   Nothing = 'nothing',
// }

// export interface Just<T> {
//   type: MaybeType.Just;
//   value: T;
// }

// export interface Nothing {
//   type: MaybeType.Nothing;
// }

// export type Maybe<T> = Just<T> | Nothing;

export interface Left<T> {
  left: T;
  right: undefined;
  type: 'left';
}

export interface Right<T> {
  left: undefined;
  right: T;
  type: 'right';
}

export type EitherType<L, R> = Left<L> | Right<R>;

export type NotEither<T> = T extends Left<any>
  ? never
  : T extends Right<any>
  ? never
  : T;

export const Either = {
  value<L, R>(either: Left<L> | Right<R>): L | R {
    if (Either.isLeft(either)) {
      return either.left;
    } else if (Either.isRight(either)) {
      return either.right;
    }

    throw new Error('Either.value: unknown type');
  },

  unwrap: <L, R>(
    either: Left<L> | Right<R>,
  ): [L, undefined] | [undefined, R] => {
    if (Either.isLeft(either)) {
      return [either.left, undefined];
    } else if (Either.isRight(either)) {
      return [undefined, either.right];
    }

    throw new Error('Either.unwrap: unknown type');
  },
  left: <T>(value: T): Left<T> => {
    return { left: value, right: undefined, type: 'left' as const };
  },

  right: <T>(value: T): Right<T> => ({
    left: undefined,
    right: value,
    type: 'right' as const,
  }),

  isLeft: <T>(either: Left<T> | Right<unknown>): either is Left<T> => {
    return either.type === 'left';
  },

  isRight: <T>(either: Left<unknown> | Right<T>): either is Right<T> => {
    return either.type === 'right';
  },

  fold: <L, R, U, V>(
    either: Left<L> | Right<R>,
    leftFn: (left: L) => U,
    rightFn: (right: R) => V,
  ): Left<U> | Right<V> => {
    if (Either.isLeft(either)) {
      return Either.left(leftFn(either.left));
    } else if (Either.isRight(either)) {
      return Either.right(rightFn(either.right));
    }

    throw new Error('Either.fold: unknown type');
  },

  map: <L, R, V>(
    either: Left<L> | Right<R>,
    rightFn: (right: R) => V,
  ): Left<L> | Right<V> => {
    return Either.fold(either, (left) => left, rightFn);
  },

  flatMap: <L, R, V>(
    either: Left<L> | Right<R>,
    rightFn: (right: R) => Left<L> | Right<V>,
  ): Left<L> | Right<V> => {
    if (Either.isLeft(either)) {
      return Either.left(either.left);
    } else if (Either.isRight(either)) {
      return rightFn(either.right);
    }

    throw new Error('Either.flatMap: unknown type');
  },

  mapLeft: <L, R, U>(
    either: Left<L> | Right<R>,
    leftFn: (left: L) => U,
  ): Left<U> | Right<R> => {
    return Either.fold(either, leftFn, (right) => right);
  },
};

// declare interface Either<L, R> {
//   map<R2>(f: (r: R) => R2): Either<L, R2>
//   leftMap<L2>(f: (l: L) => L2): Either<L2, R>

//   mapThen<R2>(f: (r: R) => Promise<R2>): Promise<Either<L, R2>>
//   leftMapThen<L2>(f: (l: L) => Promise<L2>): Promise<Either<L2, R>>

//   flatMap<R2>(f: (r: R) => Either<L, R2>): Either<L, R2>
//   leftFlatMap<L2>(f: (l: L) => Either<L2, R>): Either<L2, R>

//   flatMapThen<R2>(f: (r: R) => Promise<Either<L, R2>>): Promise<Either<L, R2>>
//   leftFlatMapThen<L2>(
//   	f: (l: L) => Promise<Either<L2, R>>): Promise<Either<L2, R>>

//   rightOrElse(f: (l: L) => R): R
//   value: L | R
//   isOk: boolean
// }
