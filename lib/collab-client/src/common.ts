import { CollabFail, CollabManager } from '@bangle.dev/collab-server';
import { Node, PluginKey, TextSelection } from '@bangle.dev/pm';

import type { ValidCollabStates2 } from './state';

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

export interface CollabPluginContext {
  readonly restartCount: number;
  readonly debugInfo: string | undefined;
}

export interface CollabPluginState {
  context: CollabPluginContext;
  collabState: ValidCollabStates2;
}
export interface TrMeta {
  context?: Partial<CollabPluginContext>;
  collabEvent?: ValidEvents;
}

export interface ClientInfo {
  readonly clientID: string;
  readonly docName: string;
  readonly retryWaitTime: number;
  readonly sendManagerRequest: CollabManager['handleRequest'];
  readonly userId: string;
}