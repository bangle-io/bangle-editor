export class CollabError extends Error {
  constructor(errorCode, body) {
    super(body);
    this.errorCode = errorCode;
    this.body = body;
    Error.captureStackTrace(this, CollabError);
    this.name = this.constructor.name;
    this.message = errorCode + ' ' + this.message;
  }
}
