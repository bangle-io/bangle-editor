export class CollabError extends Error {
  constructor(errorCode, body) {
    super(body);
    this.errorCode = errorCode;
    this.body = body;
    // Error.captureStackTrace is a v8-specific method so not avilable on
    // Firefox or Safari
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CollabError);
    } else {
      const stack = new Error().stack;
      if (stack) {
        this.stack = stack;
      }
    }
    this.name = this.constructor.name;
  }
}
