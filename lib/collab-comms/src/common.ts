export enum NetworkingError {
  Timeout = 'NetworkingError.Timeout',
}

export enum CollabFail {
  ApplyFailed = 'CollabFail.ApplyFailed',
  DocumentNotFound = 'CollabFail.DocumentNotFound',
  HistoryNotAvailable = 'CollabFail.HistoryNotAvailable',
  IncorrectManager = 'CollabFail.IncorrectManager',
  InvalidVersion = 'CollabFail.InvalidVersion',
  ManagerDestroyed = 'CollabFail.ManagerDestroyed',
  OutdatedVersion = 'CollabFail.OutdatedVersion',
  ManagerUnresponsive = 'CollabFail.ManagerUnresponsive',
}

export type CollabRequest =
  | CollabRequestGetDocument
  | CollabRequestPullEvents
  | CollabRequestPushEvents;

export enum CollabRequestType {
  GetDocument = 'CollabRequestType.GetDocument',
  PullEvents = 'CollabRequestType.PullEvents',
  PushEvents = 'CollabRequestType.PushEvents',
}

export interface CollabRequestGetDocument {
  type: CollabRequestType.GetDocument;
  request: {
    type: CollabRequestType.GetDocument;
    body: GetDocumentRequestBody;
  };
  response:
    | RequestOkResponse<CollabRequestType.GetDocument, GetDocumentResponseBody>
    | RequestNotOkResponse<CollabRequestType.GetDocument, CollabFail>;
}

export interface CollabRequestPullEvents {
  type: CollabRequestType.PullEvents;
  request: {
    type: CollabRequestType.PullEvents;
    body: PullEventsRequestBody;
  };
  response:
    | RequestOkResponse<CollabRequestType.PullEvents, PullEventsResponseBody>
    | RequestNotOkResponse<CollabRequestType.PullEvents, CollabFail>;
}
export interface CollabRequestPushEvents {
  type: CollabRequestType.PushEvents;
  request: {
    type: CollabRequestType.PushEvents;
    body: PushEventsRequestBody;
  };
  response:
    | RequestOkResponse<CollabRequestType.PushEvents, PushEventsResponseBody>
    | RequestNotOkResponse<CollabRequestType.PushEvents, CollabFail>;
}

export interface RequestOkResponse<T extends string, R> {
  type: T;
  ok: true;
  body: R;
}

export interface RequestNotOkResponse<T extends string, R> {
  type: T;
  ok: false;
  body: R;
}

export type GetDocumentRequestBody = {
  docName: string;
  userId: string;
};

export type GetDocumentResponseBody = {
  doc: { [key: string]: any };
  version: number;
  users: number;
  managerId: string;
};

export type PushEventsResponseBody = {
  empty: null;
};

export type PushEventsRequestBody = {
  version: number;
  steps: Array<{ [key: string]: any }>;
  clientID: string;
  docName: string;
  userId: string;
  managerId: string;
};

export type PullEventsResponseBody = {
  steps?: Array<{ [key: string]: any }>;
  clientIDs?: string[];
};

export type PullEventsRequestBody = {
  docName: string;
  version: number;
  userId: string;
  managerId: string;
};
