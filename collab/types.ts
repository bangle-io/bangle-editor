import { Step } from 'prosemirror-transform';
import { Selection } from 'prosemirror-state';

export type PullEventParsedResponse = {
  steps: Step[];
  clientIDs: string[];
};
export type PullEventResponse = {
  steps?: Array<{ [key: string]: any }>;
  clientIDs?: string[];
};
export type PullEvents = (obj: {
  version: number;
  docName: string;
  userId: string;
}) => Promise<PullEventResponse>;

export type PushEventsResponse = {};
export type PushEvents = (obj: {
  version: number;
  steps: Array<{ [key: string]: any }>;
  clientID: string;
  docName: string;
  userId: string;
}) => Promise<PushEventsResponse>;

export type GetDocumentResponse = {
  doc: { [key: string]: any };
  version: number;
};

export type GetDocument = (obj: {
  docName: string;
  userId: string;
}) => Promise<GetDocumentResponse>;

export type CollabConnectionObj = {
  init: (oldSelection?: Selection) => void;
  pushNewEvents: () => void;
  destroy: () => void;
};
