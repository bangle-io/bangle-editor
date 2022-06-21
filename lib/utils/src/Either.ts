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

export type Either<L, R> = LeftBase<L> | RightBase<R>;

export function Left<L, R>(left: L): Either<L, R> {
  return new LeftBase(left);
}

export function Right<L, R>(right: R): Either<L, R> {
  return new RightBase(right);
}

export abstract class EitherBase<L, R> {
  constructor(protected readonly _left: L, protected readonly _right: R) {}

  get left(): L | undefined {
    return this._left;
  }

  get right(): R | undefined {
    return this._right;
  }

  get value(): L | R {
    if (this.isLeft()) {
      return this._left;
    } else if (this.isRight()) {
      return this._right;
    }
    throw new Error('EitherBase.value: unknown type');
  }

  fold<U, V>(fn: (left: L) => U, fn2: (right: R) => V): EitherBase<U, V> {
    if (this.isLeft()) {
      return new LeftBase(fn(this._left));
    } else if (this.isRight()) {
      return new RightBase(fn2(this._right));
    }
    throw new Error('EitherBase.fold: unknown type');
  }

  isLeft(): this is LeftBase<L> {
    return this instanceof LeftBase;
  }

  isRight(): this is RightBase<R> {
    return this instanceof RightBase;
  }

  map<U>(fn: (value: R) => U): EitherBase<L, U> {
    return this.fold((l) => l, fn);
  }

  mapLeft<U>(fn: (value: L) => U): EitherBase<U, R> {
    return this.fold(fn, (r) => r);
  }

  resolve(): [L, undefined] | [undefined, R] {
    if (this.isLeft()) {
      return [this._left, undefined];
    } else if (this.isRight()) {
      return [undefined, this._right];
    }
    throw new Error('EitherBase.resolve: unknown type');
  }

  abstract tag: 'left' | 'right';
}

class LeftBase<T> extends EitherBase<T, never> {
  tag = 'left' as const;

  constructor(public readonly _left: T) {
    super(_left, undefined as never);
  }

  get left(): T {
    return this._left;
  }

  get right(): undefined {
    return undefined;
  }

  resolve(): [T, undefined] {
    return [this._left, undefined];
  }
}

class RightBase<T> extends EitherBase<never, T> {
  tag = 'right' as const;

  constructor(public readonly _right: T) {
    super(undefined as never, _right);
  }

  get left(): undefined {
    return undefined;
  }

  get right(): T {
    return this._right;
  }

  resolve(): [undefined, T] {
    return [undefined, this._right];
  }
}
