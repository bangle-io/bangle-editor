import { CollabFail, Manager2 } from '@bangle.dev/collab-server';
import { EditorView, Node, Schema, TextSelection } from '@bangle.dev/pm';

// Events
export type ValidEvents =
  | FatalErrorEvent
  | InitDocEvent
  | InitErrorEvent
  | PullEvent
  | PushEvent
  | PushPullErrorEvent
  | ReadyEvent
  | RestartEvent;

export enum EventType {
  FatalError = 'FATAL_ERROR_EVENT',
  InitDoc = 'INIT_DOC_EVENT',
  InitError = 'INIT_ERROR_EVENT',
  Push = 'PUSH_EVENT',
  Pull = 'PULL_EVENT',
  PushPullError = 'PUSH_PULL_ERROR_EVENT',
  Ready = 'READY_EVENT',
  Restart = 'RESTART_EVENT',
}

export interface FatalErrorEvent {
  type: EventType.FatalError;
  payload: {
    message: string;
  };
}

export interface InitDocEvent {
  type: EventType.InitDoc;
  payload: {
    doc: Node;
    version: number;
    managerId: string;
    selection?: TextSelection;
  };
}

export interface InitErrorEvent {
  type: EventType.InitError;
  payload: {
    failure: CollabFail;
  };
}

export interface PushEvent {
  type: EventType.Push;
}

export interface PullEvent {
  type: EventType.Pull;
}

export interface PushPullErrorEvent {
  type: EventType.PushPullError;
  payload: { failure: CollabFail };
}

export interface ReadyEvent {
  type: EventType.Ready;
}
export interface RestartEvent {
  type: EventType.Restart;
}

// States
export type ValidStates =
  | FatalErrorState
  | InitDocState
  | InitErrorState
  | InitState
  | PullState
  | PushPullErrorState
  | PushState
  | ReadyState;

export enum StateName {
  FatalError = 'FATAL_ERROR_STATE',
  Init = 'INIT_STATE',
  InitDoc = 'INIT_DOC_STATE',
  InitError = 'INIT_ERROR_STATE',
  Pull = 'PULL_STATE',
  Push = 'PUSH_STATE',
  PushPullError = 'PUSH_PULL_ERROR_STATE',
  Ready = 'READY_STATE',
}

export interface FatalErrorState {
  name: StateName.FatalError;
  state: {
    message: string;
  };
}

export interface InitState {
  name: StateName.Init;
}

export interface InitDocState {
  name: StateName.InitDoc;
  state: {
    initialDoc: Node;
    initialVersion: number;
    initialSelection?: TextSelection;
    managerId: string;
  };
}

export interface InitErrorState {
  name: StateName.InitError;
  state: {
    failure: CollabFail;
  };
}

export interface ReadyState {
  name: StateName.Ready;
  state: InitDocState['state'];
}

export interface PushState {
  name: StateName.Push;
  state: InitDocState['state'];
}

export interface PullState {
  name: StateName.Pull;
  state: InitDocState['state'];
}

export interface PushPullErrorState {
  name: StateName.PushPullError;
  state: {
    failure: CollabFail;
    initDocState: InitDocState['state'];
  };
}

export interface Context {
  readonly clientID: string;
  readonly docName: string;
  readonly retryWaitTime: number;
  readonly schema: Schema;
  readonly sendManagerRequest: Manager2['handleRequest2'];
  readonly userId: string;
  readonly view: EditorView;
  pendingUpstreamChange: boolean;
  pendingPush: boolean;
  restartCount: number;
}
