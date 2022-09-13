// This is the default value if one it not specified by the consumer.
export const DEFAULT_MANAGER_ID = '@bangle.dev/collab-manager/MANAGER';

export enum NetworkingError {
  Timeout = 'NetworkingError.Timeout',
}

export enum CollabManagerBroadCastType {
  NewVersion = 'CollabManagerBroadCastType.NewVersion',
  ResetClient = 'CollabManagerBroadCastType.ResetClient',
}

export interface CollabManagerNewVersion {
  type: CollabManagerBroadCastType.NewVersion;
  body: {
    version: number;
    docName: string;
  };
}

export interface CollabManagerResetClient {
  type: CollabManagerBroadCastType.ResetClient;
  body: {
    docName: string;
  };
}

export type CollabManagerBroadCast =
  | CollabManagerNewVersion
  | CollabManagerResetClient;

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

// ============= Client stuff =============
export type CollabClientRequest =
  | CollabClientRequestGetDocument
  | CollabClientRequestPullEvents
  | CollabClientRequestPushEvents;

export enum CollabClientRequestType {
  GetDocument = 'CollabClientRequestType.GetDocument',
  PullEvents = 'CollabClientRequestType.PullEvents',
  PushEvents = 'CollabClientRequestType.PushEvents',
}

export interface CollabClientRequestGetDocument {
  type: CollabClientRequestType.GetDocument;
  request: {
    type: CollabClientRequestType.GetDocument;
    body: GetDocumentRequestBody;
  };
  response:
    | RequestOkResponse<
        CollabClientRequestType.GetDocument,
        GetDocumentResponseBody
      >
    | RequestNotOkResponse<CollabClientRequestType.GetDocument, CollabFail>;
}

export interface CollabClientRequestPullEvents {
  type: CollabClientRequestType.PullEvents;
  request: {
    type: CollabClientRequestType.PullEvents;
    body: PullEventsRequestBody;
  };
  response:
    | RequestOkResponse<
        CollabClientRequestType.PullEvents,
        PullEventsResponseBody
      >
    | RequestNotOkResponse<CollabClientRequestType.PullEvents, CollabFail>;
}
export interface CollabClientRequestPushEvents {
  type: CollabClientRequestType.PushEvents;
  request: {
    type: CollabClientRequestType.PushEvents;
    body: PushEventsRequestBody;
  };
  response:
    | RequestOkResponse<
        CollabClientRequestType.PushEvents,
        PushEventsResponseBody
      >
    | RequestNotOkResponse<CollabClientRequestType.PushEvents, CollabFail>;
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
  clientCreatedAt: number;
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
  clientCreatedAt: number;
  clientID: string;
  docName: string;
  managerId: string;
  steps: Array<{ [key: string]: any }>;
  userId: string;
  version: number;
};

export type PullEventsResponseBody = {
  steps?: Array<{ [key: string]: any }>;
  clientIDs?: string[];
  version: number;
};

export type PullEventsRequestBody = {
  clientCreatedAt: number;
  docName: string;
  managerId: string;
  userId: string;
  version: number;
};
