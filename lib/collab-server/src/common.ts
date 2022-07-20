export enum CollabRequestType {
  GetDocument = 'CollabRequestType.GetDocument',
  PullEvents = 'CollabRequestType.PullEvents',
  PushEvents = 'CollabRequestType.PushEvents',
}

// This is the default value if one it not specified by the consumer.
export const MANAGER_ID = '@bangle.dev/collab-server/MANAGER';

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

export enum NetworkingError {
  Timeout = 'NetworkingError.Timeout',
}

export type PullEventsResponse = {
  steps?: Array<{ [key: string]: any }>;
  clientIDs?: string[];
};

export type PullEventsRequestBody = {
  docName: string;
  version: number;
  userId: string;
  managerId: string;
};

export type GetDocumentRequestBody = {
  docName: string;
  userId: string;
};
export type GetDocumentResponse = {
  doc: { [key: string]: any };
  version: number;
  users: number;
  managerId: string;
};

export type PushEventsResponse = {
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

export type CollabRequest =
  | CollabRequestGetDocument
  | CollabRequestPullEvents
  | CollabRequestPushEvents;

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

export interface CollabRequestGetDocument {
  type: CollabRequestType.GetDocument;
  request: {
    type: CollabRequestType.GetDocument;
    body: GetDocumentRequestBody;
  };
  response:
    | RequestOkResponse<CollabRequestType.GetDocument, GetDocumentResponse>
    | RequestNotOkResponse<CollabRequestType.GetDocument, CollabFail>;
}

export interface CollabRequestPullEvents {
  type: CollabRequestType.PullEvents;
  request: {
    type: CollabRequestType.PullEvents;
    body: PullEventsRequestBody;
  };
  response:
    | RequestOkResponse<CollabRequestType.PullEvents, PullEventsResponse>
    | RequestNotOkResponse<CollabRequestType.PullEvents, CollabFail>;
}
export interface CollabRequestPushEvents {
  type: CollabRequestType.PushEvents;
  request: {
    type: CollabRequestType.PushEvents;
    body: PushEventsRequestBody;
  };
  response:
    | RequestOkResponse<CollabRequestType.PushEvents, PushEventsResponse>
    | RequestNotOkResponse<CollabRequestType.PushEvents, CollabFail>;
}
