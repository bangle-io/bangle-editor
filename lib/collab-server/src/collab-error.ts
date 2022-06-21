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

export enum CollabFail {
  InvalidVersion = 'InvalidVersion', // 400
  OutdatedVersion = 'OutdatedVersion', // 409
  ApplyFailed = 'ApplyFailed', // ??
  HistoryNotAvailable = 'HistoryNotAvailable', // 410
  IncorrectManager = 'IncorrectManager', // 410

  DocumentNotFound = 'DocumentNotFound', // 404
}

export const COLLAB_STATUS_FAIL = 'fail' as const;
export const COLLAB_STATUS_OK = 'ok' as const;

export function throwCollabError(reason: CollabFail): never {
  switch (reason) {
    case CollabFail.InvalidVersion:
      throw new CollabError(400, 'Invalid version');
    case CollabFail.OutdatedVersion:
      throw new CollabError(409, 'Outdated version');
    case CollabFail.ApplyFailed:
      throw new CollabError(500, 'Apply failed');
    case CollabFail.HistoryNotAvailable:
      throw new CollabError(410, 'Server or History no longer available');
    case CollabFail.DocumentNotFound:
      throw new CollabError(404, `Document not found`);
    case CollabFail.IncorrectManager:
      throw new CollabError(410, `Incorrect manager`);

    default: {
      let val: never = reason;
      throw new Error('Unknown target');
    }
  }
}
