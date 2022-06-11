export type ValidErrorCodes = 404 | 400 | 410 | 409 | 500;

export class CollabError extends Error {
  from?: string;
  errorCode: ValidErrorCodes;
  body: any;
  constructor(errorCode: ValidErrorCodes, message: any) {
    super(message);
    this.errorCode = errorCode;
    this.body = message;

    // Error.captureStackTrace is a v8-specific method so not avilable on
    // Firefox or Safari
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, CollabError);
    } else {
      const stack = new Error().stack;
      if (stack) {
        this.stack = stack;
      }
    }
    this.name = this.constructor.name;
  }
}
