import { CollabFail } from '@bangle.dev/collab-server';
import { Node, PluginKey, TextSelection } from '@bangle.dev/pm';

export const collabClientKey = new PluginKey<CollabPluginState>(
  'bangle.dev/collab-client',
);
export interface CollabSettings {
  serverVersion: undefined | number;
}
export const collabSettingsKey = new PluginKey<CollabSettings>(
  'bangle/collabSettingsKey',
);

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

export enum CollabStateName {
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
  name: CollabStateName.FatalError;
  state: {
    message: string;
  };
}

export interface InitState {
  name: CollabStateName.Init;
}

export interface InitDocState {
  name: CollabStateName.InitDoc;
  state: {
    initialDoc: Node;
    initialVersion: number;
    initialSelection?: TextSelection;
    managerId: string;
  };
}

export interface InitErrorState {
  name: CollabStateName.InitError;
  state: {
    failure: CollabFail;
  };
}

export interface ReadyState {
  name: CollabStateName.Ready;
  state: InitDocState['state'];
}

export interface PushState {
  name: CollabStateName.Push;
  state: InitDocState['state'];
}

export interface PullState {
  name: CollabStateName.Pull;
  state: InitDocState['state'];
}

export interface PushPullErrorState {
  name: CollabStateName.PushPullError;
  state: {
    failure: CollabFail;
    initDocState: InitDocState['state'];
  };
}

export interface CollabPluginContext {
  readonly restartCount: number;
  readonly debugInfo: string | undefined;
}

export interface CollabPluginState {
  context: CollabPluginContext;
  collabState: ValidStates;
}
export interface TrMeta {
  context?: Partial<CollabPluginContext>;
  collabEvent?: ValidEvents;
}
