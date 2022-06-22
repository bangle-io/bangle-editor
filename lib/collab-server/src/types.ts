export type PullEventsType = 'pull_events';
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

export type GetDocumentType = 'get_document';
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

export type PushEventsType = 'push_events';
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

export type CollabRequestParam =
  | PullEventsRequestParam
  | GetDocumentRequestParam
  | PushEventsRequestParam;

export type CollabResponse =
  | PullEventResponse
  | GetDocumentResponse
  | PushEventsResponse;

export type ServerRequest =
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
