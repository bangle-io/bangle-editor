export const PULL_EVENTS = 'pull_events';
export type PullEventsType = typeof PULL_EVENTS;
export type PullEventResponse = {
  steps?: Array<{ [key: string]: any }>;
  clientIDs?: string[];
};
export type PullEventsRequestParam = {
  docName: string;
  version: number;
  userId: string;
  managerId: string;
};

export const GET_DOCUMENT = 'get_document';
export type GetDocumentType = typeof GET_DOCUMENT;
export type GetDocumentRequestParam = {
  docName: string;
  userId: string;
};
export type GetDocumentResponse = {
  doc: { [key: string]: any };
  version: number;
  users: number;
  managerId: string;
};

export const PUSH_EVENTS = 'push_events';
export type PushEventsType = typeof PUSH_EVENTS;
export type PushEventsResponse = {
  empty: null;
};
export type PushEventsRequestParam = {
  version: number;
  steps: Array<{ [key: string]: any }>;
  clientID: string;
  docName: string;
  userId: string;
  managerId: string;
};

export type PullEvents = (
  obj: PullEventsRequestParam,
) => Promise<PullEventResponse>;
export type GetDocument = (
  obj: GetDocumentRequestParam,
) => Promise<GetDocumentResponse>;
export type PushEvents = (
  obj: PushEventsRequestParam,
) => Promise<PushEventsResponse>;

export type CollabRequestType =
  | GetDocumentType
  | PullEventsType
  | PushEventsType;

export type ManagerRequest =
  | {
      type: GetDocumentType;
      payload: GetDocumentRequestParam;
    }
  | {
      type: PullEventsType;
      payload: PullEventsRequestParam;
    }
  | {
      type: PushEventsType;
      payload: PushEventsRequestParam;
    };

export type ManagerResponse =
  | {
      type: GetDocumentType;
      payload: GetDocumentResponse;
    }
  | {
      type: PullEventsType;
      payload: PullEventResponse;
    }
  | {
      type: PushEventsType;
      payload: PushEventsResponse;
    };

export enum CollabFail {
  ApplyFailed = 'ApplyFailed', // ??
  DocumentNotFound = 'DocumentNotFound', // 404
  HistoryNotAvailable = 'HistoryNotAvailable', // 410
  IncorrectManager = 'IncorrectManager', // 410
  InvalidVersion = 'InvalidVersion', // 400
  OutdatedVersion = 'OutdatedVersion', // 409
}
