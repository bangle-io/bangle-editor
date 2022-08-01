import { getVersion, sendableSteps } from 'prosemirror-collab';

import { CollabFail } from '@bangle.dev/collab-comms';
import {
  Command,
  EditorState,
  EditorView,
  Node,
  TextSelection,
} from '@bangle.dev/pm';
import { abortableSetTimeout, sleep } from '@bangle.dev/utils';

import {
  isOutdatedVersion,
  isStuckInErrorStates,
  updateServerVersion,
} from './commands';
import {
  ClientInfo,
  collabClientKey,
  CollabStateName,
  EventType,
  FatalErrorEvent,
  InitDocEvent,
  InitErrorEvent,
  PullEvent,
  PushEvent,
  PushPullErrorEvent,
  ReadyEvent,
  RestartEvent,
  ValidEvents,
} from './common';
import { applyDoc, applySteps } from './helpers';

interface ActionParam {
  clientInfo: ClientInfo;
  logger: (...args: any[]) => void;
  signal: AbortSignal;
  view: EditorView;
}

export type ValidCollabStates =
  | FatalErrorState
  | InitDocState
  | InitErrorState
  | InitState
  | PullState
  | PushPullErrorState
  | PushState
  | ReadyState;

export abstract class CollabBaseState {
  // If false, the document is frozen and no edits and _almost_ no transactions are allowed.
  // Some collab tr's are allowed.
  editingAllowed: boolean = true;
  debugInfo?: string;
  createdAt = Date.now();
  public dispatchCollabPluginEvent(data: {
    signal: AbortSignal;
    collabEvent?: ValidEvents;
    debugInfo?: string;
  }): Command {
    return (state, dispatch) => {
      if (!data.signal.aborted) {
        dispatch?.(state.tr.setMeta(collabClientKey, data));
        return true;
      }
      return false;
    };
  }

  abstract isErrorState: boolean;

  public isFatalState(): this is FatalErrorState {
    return this instanceof FatalErrorState;
  }

  public isReadyState(): this is ReadyState {
    return this instanceof ReadyState;
  }

  abstract name: CollabStateName;

  abstract runAction(param: ActionParam): Promise<void>;
  // must be kept pure , sync and no side-effects
  abstract transition(
    event: ValidEvents,
    debugInfo?: string,
  ): ValidCollabStates | undefined;
}

export class FatalErrorState extends CollabBaseState {
  editingAllowed = false;
  isErrorState = true;
  name = CollabStateName.FatalError;

  constructor(
    public state: {
      message: string;
    },
    public debugInfo?: string,
  ) {
    super();
  }

  dispatch(
    signal: AbortSignal,
    state: EditorState,
    dispatch: EditorView['dispatch'] | undefined,
    event: never,
    debugInfo?: string,
  ) {
    return this.dispatchCollabPluginEvent({
      signal,
      collabEvent: event,
      debugInfo,
    })(state, dispatch);
  }

  async runAction({ signal, clientInfo, logger }: ActionParam) {
    if (signal.aborted) {
      return;
    }
    logger(
      `Freezing document(${clientInfo.docName}) to prevent further edits due to FatalError`,
    );
    return;
  }

  transition(event: any, debugInfo?: string) {
    return this;
  }
}

export class InitState extends CollabBaseState {
  editingAllowed = false;
  isErrorState = false;
  name = CollabStateName.Init;

  constructor(public state = {}, public debugInfo?: string) {
    super();
  }

  dispatch(
    signal: AbortSignal,
    state: EditorState,
    dispatch: EditorView['dispatch'] | undefined,
    event: Parameters<InitState['transition']>[0],
    debugInfo?: string,
  ) {
    return this.dispatchCollabPluginEvent({
      signal,
      collabEvent: event,
      debugInfo,
    })(state, dispatch);
  }

  async runAction({ clientInfo, signal, view }: ActionParam) {
    if (signal.aborted) {
      return;
    }
    const { docName, userId, clientCom } = clientInfo;
    const debugSource = `initStateAction:`;

    // Wait for the editor state to settle in before make the getDocument request.
    if (typeof clientInfo.warmupTime === 'number') {
      await sleep(clientInfo.warmupTime);
      if (signal.aborted) {
        return;
      }
    }

    const result = await clientCom.getDocument({
      docName,
      userId,
    });

    if (signal.aborted) {
      return;
    }

    if (!result.ok) {
      this.dispatch(
        signal,
        view.state,
        view.dispatch,
        {
          type: EventType.InitError,
          payload: { failure: result.body },
        },
        debugSource,
      );
      return;
    }

    const { doc, managerId, version } = result.body;

    this.dispatch(
      signal,
      view.state,
      view.dispatch,
      {
        type: EventType.InitDoc,
        payload: {
          doc: view.state.schema.nodeFromJSON(doc),
          version,
          managerId,
          selection: undefined,
        },
      },
      debugSource,
    );
    return;
  }

  transition(
    event: InitDocEvent | InitErrorEvent,
    debugInfo?: string,
  ): InitDocState | InitErrorState | undefined {
    const type = event.type;
    if (type === EventType.InitDoc) {
      const { payload } = event;
      return new InitDocState(
        {
          initialDoc: payload.doc,
          initialSelection: payload.selection,
          initialVersion: payload.version,
          managerId: payload.managerId,
        },
        debugInfo,
      );
    } else if (type === EventType.InitError) {
      return new InitErrorState(
        {
          failure: event.payload.failure,
        },
        debugInfo,
      );
    } else {
      // This should not get called by any statically findable .transition() . However
      // dynamic code can possibly call it and it should be safe to ignore.
      let val: never = type;
      console.debug('@bangle.dev/collab-client Ignoring event' + type);
      return;
    }
  }
}

export class InitDocState extends CollabBaseState {
  editingAllowed = false;
  isErrorState = false;
  name = CollabStateName.InitDoc;

  constructor(
    public state: {
      initialDoc: Node;
      initialVersion: number;
      initialSelection?: TextSelection;
      managerId: string;
    },
    public debugInfo?: string,
  ) {
    super();
  }

  dispatch(
    signal: AbortSignal,
    state: EditorState,
    dispatch: EditorView['dispatch'] | undefined,
    event: Parameters<InitDocState['transition']>[0],
    debugInfo?: string,
  ) {
    return this.dispatchCollabPluginEvent({
      signal,
      collabEvent: event,
      debugInfo,
    })(state, dispatch);
  }

  async runAction({ signal, view }: ActionParam) {
    if (signal.aborted) {
      return;
    }
    const { initialDoc, initialVersion, initialSelection } = this.state;

    if (!signal.aborted) {
      const success = applyDoc(
        view,
        initialDoc,
        initialVersion,
        initialSelection,
      );

      if (success === false) {
        this.dispatch(signal, view.state, view.dispatch, {
          type: EventType.FatalError,
          payload: {
            message: 'Failed to load initial doc',
          },
        });
      } else {
        this.dispatch(
          signal,
          view.state,
          view.dispatch,
          {
            type: EventType.Ready,
          },
          `runAction:${this.name}`,
        );
      }
    }
  }

  transition(
    event: ReadyEvent | FatalErrorEvent,
    debugInfo?: string,
  ): ReadyState | FatalErrorState | undefined {
    const type = event.type;
    if (type === EventType.Ready) {
      return new ReadyState(this.state, debugInfo);
    } else if (type === EventType.FatalError) {
      return new FatalErrorState({ message: event.payload.message }, debugInfo);
    } else {
      let val: never = type;
      console.debug('@bangle.dev/collab-client Ignoring event' + type);
      return;
    }
  }
}

export class InitErrorState extends CollabBaseState {
  editingAllowed = false;
  isErrorState = true;
  name = CollabStateName.InitError;

  constructor(
    public state: {
      failure: CollabFail;
    },
    public debugInfo?: string,
  ) {
    super();
  }

  dispatch(
    signal: AbortSignal,
    state: EditorState,
    dispatch: EditorView['dispatch'] | undefined,
    event: Parameters<InitErrorState['transition']>[0],
    debugInfo?: string,
  ) {
    return this.dispatchCollabPluginEvent({
      signal,
      collabEvent: event,
      debugInfo,
    })(state, dispatch);
  }

  async runAction(param: ActionParam) {
    await handleErrorStateAction({ ...param, collabState: this });
  }

  transition(event: RestartEvent | FatalErrorEvent, debugInfo?: string) {
    const type = event.type;
    if (type === EventType.Restart) {
      return new InitState(undefined, debugInfo);
    } else if (type === EventType.FatalError) {
      return new FatalErrorState({ message: event.payload.message }, debugInfo);
    } else {
      let val: never = type;
      console.debug('@bangle.dev/collab-client Ignoring event' + type);
      return undefined;
    }
  }
}

export class ReadyState extends CollabBaseState {
  editingAllowed = true;
  isErrorState = false;
  name = CollabStateName.Ready;

  constructor(public state: InitDocState['state'], public debugInfo?: string) {
    super();
  }

  dispatch(
    signal: AbortSignal,
    state: EditorState,
    dispatch: EditorView['dispatch'] | undefined,
    event: PullEvent | PushEvent,
    debugInfo?: string,
  ): boolean {
    return this.dispatchCollabPluginEvent({
      signal,
      collabEvent: event,
      debugInfo,
    })(state, dispatch);
  }

  async runAction({ signal, view }: ActionParam) {
    if (signal.aborted) {
      return;
    }
    const debugString = `runActions:${this.name}`;

    if (!signal.aborted) {
      if (isOutdatedVersion()(view.state)) {
        this.dispatch(
          signal,
          view.state,
          view.dispatch,
          {
            type: EventType.Pull,
          },
          debugString + '(outdated-local-version)',
        );
      } else if (sendableSteps(view.state)) {
        this.dispatch(
          signal,
          view.state,
          view.dispatch,
          {
            type: EventType.Push,
          },
          debugString + '(sendable-steps)',
        );
      }
    }
    return;
  }

  transition(event: Parameters<ReadyState['dispatch']>[3], debugInfo?: string) {
    const type = event.type;
    if (type === EventType.Push) {
      return new PushState(this.state, debugInfo);
    } else if (type === EventType.Pull) {
      return new PullState(this.state, debugInfo);
    } else {
      let val: never = type;
      console.debug('@bangle.dev/collab-client Ignoring event' + type);
      return;
    }
  }
}

export class PushState extends CollabBaseState {
  editingAllowed = true;
  isErrorState = false;
  name = CollabStateName.Push;

  constructor(public state: InitDocState['state'], public debugInfo?: string) {
    super();
  }

  dispatch(
    signal: AbortSignal,
    state: EditorState,
    dispatch: EditorView['dispatch'] | undefined,
    event: Parameters<PushState['transition']>[0],
    debugInfo?: string,
  ) {
    return this.dispatchCollabPluginEvent({
      signal,
      collabEvent: event,
      debugInfo,
    })(state, dispatch);
  }

  async runAction({ clientInfo, signal, view }: ActionParam) {
    if (signal.aborted) {
      return;
    }
    const { docName, userId, clientCom } = clientInfo;
    const debugSource = `pushStateAction:`;

    const steps = sendableSteps(view.state);

    if (!steps) {
      this.dispatch(
        signal,
        view.state,
        view.dispatch,
        {
          type: EventType.Ready,
        },
        debugSource + '(no steps):',
      );

      return;
    }

    const { managerId } = this.state;
    const response = await clientCom.pushEvents({
      version: getVersion(view.state),
      steps: steps ? steps.steps.map((s) => s.toJSON()) : [],
      // TODO  the default value numerical 0 before
      clientID: (steps ? steps.clientID : 0) + '',
      docName: docName,
      userId: userId,
      managerId: managerId,
    });

    if (signal.aborted) {
      return;
    }

    if (response.ok) {
      // Pull changes to confirm our steps and also
      // get any new steps from other clients
      this.dispatch(
        signal,
        view.state,
        view.dispatch,
        {
          type: EventType.Pull,
        },
        debugSource,
      );
    } else {
      this.dispatch(
        signal,
        view.state,
        view.dispatch,
        {
          type: EventType.PushPullError,
          payload: { failure: response.body },
        },
        debugSource,
      );
    }
    return;
  }

  transition(
    event: ReadyEvent | PullEvent | PushPullErrorEvent,
    debugInfo?: string,
  ) {
    const type = event.type;
    if (type === EventType.Ready) {
      return new ReadyState(this.state, debugInfo);
    } else if (type === EventType.Pull) {
      return new PullState(this.state, debugInfo);
    } else if (type === EventType.PushPullError) {
      return new PushPullErrorState(
        {
          failure: event.payload.failure,
          initDocState: this.state,
        },
        debugInfo,
      );
    } else {
      let val: never = type;
      console.debug('@bangle.dev/collab-client Ignoring event' + type);
      return;
    }
  }
}

export class PullState extends CollabBaseState {
  editingAllowed = true;
  isErrorState = false;
  name = CollabStateName.Pull;

  constructor(public state: InitDocState['state'], public debugInfo?: string) {
    super();
  }

  dispatch(
    signal: AbortSignal,
    state: EditorState,
    dispatch: EditorView['dispatch'] | undefined,
    event: Parameters<PullState['transition']>[0],
    debugInfo?: string,
  ) {
    return this.dispatchCollabPluginEvent({
      signal,
      collabEvent: event,
      debugInfo,
    })(state, dispatch);
  }

  async runAction({ logger, clientInfo, signal, view }: ActionParam) {
    if (signal.aborted) {
      return;
    }
    const { docName, userId, clientCom } = clientInfo;
    const { managerId } = this.state;
    const response = await clientCom.pullEvents({
      version: getVersion(view.state),
      docName: docName,
      userId: userId,
      managerId: managerId,
    });
    if (signal.aborted) {
      return;
    }
    const debugSource = `pullStateAction:`;

    if (response.ok) {
      const success = applySteps(view, response.body, logger);
      if (success === false) {
        this.dispatch(
          signal,
          view.state,
          view.dispatch,
          {
            type: EventType.PushPullError,
            payload: { failure: CollabFail.ApplyFailed },
          },
          debugSource + '(local-apply-failed)',
        );
      } else {
        // keep our local server version up to date with what server responded with
        updateServerVersion(response.body.version)(view.state, view.dispatch);

        this.dispatch(
          signal,
          view.state,
          view.dispatch,
          {
            type: EventType.Ready,
          },
          debugSource,
        );
      }
    } else {
      this.dispatch(
        signal,
        view.state,
        view.dispatch,
        {
          type: EventType.PushPullError,
          payload: { failure: response.body },
        },
        debugSource,
      );
    }
    return;
  }

  transition(event: ReadyEvent | PushPullErrorEvent, debugInfo?: string) {
    const type = event.type;
    if (type === EventType.Ready) {
      return new ReadyState(this.state, debugInfo);
    } else if (type === EventType.PushPullError) {
      return new PushPullErrorState(
        {
          failure: event.payload.failure,
          initDocState: this.state,
        },
        debugInfo,
      );
    } else {
      let val: never = type;
      return;
    }
  }
}

export class PushPullErrorState extends CollabBaseState {
  editingAllowed = true;
  isErrorState = true;
  name = CollabStateName.PushPullError;

  constructor(
    public state: {
      failure: CollabFail;
      initDocState: InitDocState['state'];
    },
    public debugInfo?: string,
  ) {
    super();
  }

  dispatch(
    signal: AbortSignal,
    state: EditorState,
    dispatch: EditorView['dispatch'] | undefined,
    event: Parameters<PushPullErrorState['transition']>[0],
    debugInfo?: string,
  ) {
    return this.dispatchCollabPluginEvent({
      signal,
      collabEvent: event,
      debugInfo,
    })(state, dispatch);
  }

  async runAction(param: ActionParam) {
    await handleErrorStateAction({ ...param, collabState: this });
  }

  transition(
    event: RestartEvent | PullEvent | FatalErrorEvent,
    debugInfo?: string,
  ) {
    const type = event.type;
    if (type === EventType.Restart) {
      return new InitState(undefined, debugInfo);
    } else if (type === EventType.Pull) {
      return new PullState(this.state.initDocState, debugInfo);
    } else if (type === EventType.FatalError) {
      return new FatalErrorState({ message: event.payload.message }, debugInfo);
    } else {
      let val: never = type;
      console.debug('@bangle.dev/collab-client Ignoring event' + type);
      return;
    }
  }
}

const handleErrorStateAction = async ({
  clientInfo,
  view,
  logger,
  signal,
  collabState,
}: ActionParam & { collabState: InitErrorState | PushPullErrorState }) => {
  if (signal.aborted) {
    return;
  }
  const failure = collabState.state.failure;

  logger('Handling failure=', failure, 'currentState=', collabState.name);

  const debugSource = `pushPullErrorStateAction(${failure}):`;

  if (isStuckInErrorStates()(view.state)) {
    collabState.dispatch(
      signal,
      view.state,
      view.dispatch,
      {
        type: EventType.FatalError,
        payload: {
          message: 'Stuck in error loop, last failure: ' + failure,
        },
      },
      debugSource,
    );
    return;
  }

  switch (failure) {
    case CollabFail.InvalidVersion: {
      abortableSetTimeout(
        () => {
          if (!signal.aborted) {
            collabState.dispatch(
              signal,
              view.state,
              view.dispatch,
              {
                type: EventType.Restart,
              },
              debugSource,
            );
          }
        },
        signal,
        clientInfo.cooldownTime,
      );
      return;
    }

    case CollabFail.IncorrectManager: {
      collabState.dispatch(
        signal,
        view.state,
        view.dispatch,
        {
          type: EventType.FatalError,
          payload: {
            message: 'Incorrect manager',
          },
        },
        debugSource,
      );
      return;
    }
    case CollabFail.HistoryNotAvailable: {
      collabState.dispatch(
        signal,
        view.state,
        view.dispatch,
        {
          type: EventType.FatalError,
          payload: {
            message: 'History/Server not available',
          },
        },
        debugSource,
      );
      return;
    }
    case CollabFail.DocumentNotFound: {
      logger('Document not found');
      collabState.dispatch(
        signal,
        view.state,
        view.dispatch,
        {
          type: EventType.FatalError,
          payload: {
            message: 'Document not found',
          },
        },
        debugSource,
      );
      return;
    }
    // 409
    case CollabFail.OutdatedVersion: {
      if (collabState instanceof PushPullErrorState) {
        collabState.dispatch(
          signal,
          view.state,
          view.dispatch,
          {
            type: EventType.Pull,
          },
          debugSource,
        );
      } else {
        collabState.dispatch(
          signal,
          view.state,
          view.dispatch,
          {
            type: EventType.FatalError,
            payload: {
              message: `Cannot handle ${failure} in state=${collabState.name}`,
            },
          },
          debugSource,
        );
      }

      return;
    }

    // 500
    case CollabFail.ManagerDestroyed: {
      abortableSetTimeout(
        () => {
          if (!signal.aborted) {
            if (collabState instanceof PushPullErrorState) {
              collabState.dispatch(
                signal,
                view.state,
                view.dispatch,
                {
                  type: EventType.Pull,
                },
                debugSource,
              );
            } else if (collabState instanceof InitErrorState) {
              collabState.dispatch(
                signal,
                view.state,
                view.dispatch,
                {
                  type: EventType.Restart,
                },
                debugSource,
              );
            } else {
              let val: never = collabState;
            }
          }
        },
        signal,
        clientInfo.cooldownTime,
      );
      return;
    }
    case CollabFail.ApplyFailed: {
      if (collabState instanceof PushPullErrorState) {
        abortableSetTimeout(
          () => {
            if (!signal.aborted) {
              collabState.dispatch(
                signal,
                view.state,
                view.dispatch,
                {
                  type: EventType.Pull,
                },
                debugSource,
              );
            }
          },
          signal,
          clientInfo.cooldownTime,
        );
      } else {
        collabState.dispatch(
          signal,
          view.state,
          view.dispatch,
          {
            type: EventType.FatalError,
            payload: {
              message: `Cannot handle ${failure} in state=${collabState.name}`,
            },
          },
          debugSource,
        );
      }
      return;
    }

    case CollabFail.ManagerUnresponsive: {
      abortableSetTimeout(
        () => {
          if (!signal.aborted) {
            if (collabState instanceof PushPullErrorState) {
              collabState.dispatch(
                signal,
                view.state,
                view.dispatch,
                {
                  type: EventType.Pull,
                },
                debugSource,
              );
            } else if (collabState instanceof InitErrorState) {
              collabState.dispatch(
                signal,
                view.state,
                view.dispatch,
                {
                  type: EventType.Restart,
                },
                debugSource,
              );
            } else {
              let val: never = collabState;
            }
          }
        },
        signal,
        clientInfo.cooldownTime,
      );
      return;
    }

    default: {
      let val: never = failure;
      throw new Error(`Unknown failure ${failure}`);
    }
  }
};
