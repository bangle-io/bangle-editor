export enum CollabRequestType {
  GetDocument = 'CollabRequestType.GetDocument',
  PullEvents = 'CollabRequestType.PullEvents',
  PushEvents = 'CollabRequestType.PushEvents',
}

export enum CollabFail {
  ApplyFailed = 'CollabFail.ApplyFailed',
  DocumentNotFound = 'CollabFail.DocumentNotFound',
  HistoryNotAvailable = 'CollabFail.HistoryNotAvailable',
  IncorrectManager = 'CollabFail.IncorrectManager',
  InvalidVersion = 'CollabFail.InvalidVersion',
  ManagerDestroyed = 'CollabFail.ManagerDestroyed',
  OutdatedVersion = 'CollabFail.OutdatedVersion',
}

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

export type CollabRequest =
  | {
      type: CollabRequestType.GetDocument;
      payload: GetDocumentRequestParam;
    }
  | {
      type: CollabRequestType.PullEvents;
      payload: PullEventsRequestParam;
    }
  | {
      type: CollabRequestType.PushEvents;
      payload: PushEventsRequestParam;
    };

export type CollabResponse =
  | {
      type: CollabRequestType.GetDocument;
      payload: GetDocumentResponse;
    }
  | {
      type: CollabRequestType.PullEvents;
      payload: PullEventResponse;
    }
  | {
      type: CollabRequestType.PushEvents;
      payload: PushEventsResponse;
    };
