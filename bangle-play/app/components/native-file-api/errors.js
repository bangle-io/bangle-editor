export class NoPermissionError extends Error {
  constructor(errorCode, body) {
    super(body);
    this.errorCode = errorCode;
    this.body = body;
    Error.captureStackTrace(this, NoPermissionError);
    this.name = this.constructor.name;
  }
}
