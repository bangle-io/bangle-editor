import { getVersion, sendableSteps } from 'prosemirror-collab';

import { CollabFail, CollabRequestType } from '@bangle.dev/collab-server';
import { abortableSetTimeout, isTestEnv } from '@bangle.dev/utils';

import {
  Context,
  EventType,
  InitErrorState,
  InitState,
  PullState,
  PushPullErrorState,
  PushState,
  StateName,
  ValidEvents,
  ValidStates,
} from './common';
import { applyDoc, applySteps, freezeDoc } from './helpers';

const LOG = true;
let log = (isTestEnv ? false : LOG)
  ? console.debug.bind(console, `collab-client:`)
  : () => {};

const MAX_RESTARTS = 100;

export function collabClient(
  param: Omit<
    Context,
    'pendingPush' | 'pendingUpstreamChange' | 'restartCount'
  >,
) {
  const logger = (...args: any[]) =>
    log(
      `${param.clientID}:version=${getVersion(context.view.state)}:`,
      ...args,
    );

  const context: Context = {
    ...param,
    pendingPush: false,
    pendingUpstreamChange: false,
    restartCount: 0,
  };

  let gState: ValidStates = { name: StateName.Init };
  let controller = new AbortController();

  const dispatchEvent = (event: ValidEvents, debugString?: string): void => {
    if (event.type === EventType.Restart) {
      context.restartCount++;
    }

    if (context.restartCount > MAX_RESTARTS) {
      freezeDoc(context.view);
      throw new Error('Too many restarts');
    }

    const state = applyState(gState, event, logger);

    // only update state if it changed, we donot support self transitions
    if (gState.name !== state.name) {
      controller.abort();
      controller = new AbortController();
      logger(
        debugString ? `from=${debugString}:` : '',
        `event ${event.type} changed state from ${gState.name} to ${state.name}`,
      );
      gState = state;
      runActions(context, state, controller.signal, dispatchEvent, logger);
    } else {
      logger(debugString, `event ${event.type} ignored`);
    }
  };

  runActions(context, gState, controller.signal, dispatchEvent, logger);

  return {
    onUpstreamChange() {
      if (gState.name === StateName.Ready) {
        dispatchEvent({ type: EventType.Pull }, 'onUpstreamChange');
      } else {
        context.pendingUpstreamChange = true;
      }
    },

    onLocalEdits() {
      if (gState.name === StateName.Ready) {
        dispatchEvent({ type: EventType.Push }, 'onLocalEdits');
      } else {
        context.pendingPush = true;
      }
    },

    async destroy() {
      controller.abort();
    },
  };
}

// Must be kept pure -- no side effects
export function applyState(
  state: ValidStates,
  event: ValidEvents,
  logger: (...args: any[]) => void,
): ValidStates {
  const logIgnoreEvent = (state: ValidStates, event: ValidEvents) => {
    logger(
      'applyState:',
      `Ignoring event ${event.type} in state ${state.name}`,
    );
  };

  const stateName = state.name;

  switch (stateName) {
    // FatalError is terminal and should not allow at state transitions
    case StateName.FatalError: {
      logIgnoreEvent(state, event);
      return state;
    }

    case StateName.InitDoc: {
      if (event.type === EventType.Ready) {
        return { name: StateName.Ready, state: state.state };
      }

      logIgnoreEvent(state, event);
      return state;
    }

    case StateName.InitError: {
      if (event.type === EventType.Restart) {
        return { name: StateName.Init };
      } else if (event.type === EventType.FatalError) {
        return {
          name: StateName.FatalError,
          state: { message: event.payload.message },
        };
      }

      logIgnoreEvent(state, event);
      return state;
    }

    case StateName.Init: {
      if (event.type === EventType.InitDoc) {
        const { payload } = event;
        return {
          name: StateName.InitDoc,
          state: {
            initialDoc: payload.doc,
            initialSelection: payload.selection,
            initialVersion: payload.version,
            managerId: payload.managerId,
          },
        };
      } else if (event.type === EventType.InitError) {
        return {
          name: StateName.InitError,
          state: { failure: event.payload.failure },
        };
      }

      logIgnoreEvent(state, event);
      return state;
    }

    case StateName.Pull: {
      if (event.type === EventType.Ready) {
        return { name: StateName.Ready, state: state.state };
      } else if (event.type === EventType.PushPullError) {
        return {
          name: StateName.PushPullError,
          state: {
            failure: event.payload.failure,
            initDocState: state.state,
          },
        };
      }

      logIgnoreEvent(state, event);
      return state;
    }

    case StateName.PushPullError: {
      if (event.type === EventType.Restart) {
        return { name: StateName.Init };
      } else if (event.type === EventType.Pull) {
        return { name: StateName.Pull, state: state.state.initDocState };
      } else if (event.type === EventType.FatalError) {
        return {
          name: StateName.FatalError,
          state: { message: event.payload.message },
        };
      }

      logIgnoreEvent(state, event);
      return state;
    }

    case StateName.Push: {
      if (event.type === EventType.Ready) {
        return { name: StateName.Ready, state: state.state };
      } else if (event.type === EventType.Pull) {
        return { name: StateName.Pull, state: state.state };
      } else if (event.type === EventType.PushPullError) {
        return {
          name: StateName.PushPullError,
          state: {
            failure: event.payload.failure,
            initDocState: state.state,
          },
        };
      }

      logIgnoreEvent(state, event);
      return state;
    }

    case StateName.Ready: {
      if (event.type === EventType.Push) {
        return { name: StateName.Push, state: state.state };
      } else if (event.type === EventType.Pull) {
        return { name: StateName.Pull, state: state.state };
      }

      logIgnoreEvent(state, event);
      return state;
    }

    default: {
      let val: never = stateName;
      throw new Error(`Unknown state ${stateName}`);
    }
  }
}

// code that needs to run when state changes
export async function runActions(
  context: Context,
  state: ValidStates,
  signal: AbortSignal,
  dispatch: (event: ValidEvents, debugString?: string) => void,
  logger: (...args: any[]) => void,
): Promise<void> {
  if (signal.aborted) {
    return;
  }

  const stateName = state.name;
  const { view } = context;

  logger(`running action for ${stateName}`);

  const debugString = `runActions:${stateName}`;

  switch (stateName) {
    case StateName.FatalError: {
      logger(
        `Freezing document(${context.docName}) to prevent further edits due to FatalError`,
      );
      freezeDoc(view);
      return;
    }
    case StateName.InitDoc: {
      const { initialDoc, initialVersion, initialSelection } = state.state;

      if (!signal.aborted) {
        applyDoc(view, initialDoc, initialVersion, initialSelection);
        dispatch(
          {
            type: EventType.Ready,
          },
          debugString,
        );
      }
      return;
    }

    case StateName.InitError: {
      return handleErrorStateAction(context, dispatch, logger, signal, state);
    }

    case StateName.Init: {
      return initStateAction(context, dispatch, logger, signal, state);
    }

    case StateName.Pull: {
      return pullStateAction(context, dispatch, logger, signal, state);
    }

    case StateName.PushPullError: {
      return handleErrorStateAction(context, dispatch, logger, signal, state);
    }

    case StateName.Push: {
      return pushStateAction(context, dispatch, logger, signal, state);
    }

    // Ready state is a special state where pending changes are dispatched
    // or if no pending changes, it waits for new changes.
    case StateName.Ready: {
      if (!signal.aborted) {
        if (context.pendingUpstreamChange) {
          context.pendingUpstreamChange = false;
          dispatch({ type: EventType.Pull }, debugString);
        } else if (context.pendingPush) {
          context.pendingPush = false;
          dispatch({ type: EventType.Push }, debugString);
        }
      }
      return;
    }

    default: {
      let val: never = stateName;
      throw new Error(`runActions unknown state ${stateName}`);
    }
  }
}

async function initStateAction(
  context: Context,
  dispatch: (event: ValidEvents, debugString?: string) => void,
  logger: (...args: any[]) => void,
  signal: AbortSignal,
  state: InitState,
) {
  const { docName, schema, userId, sendManagerRequest } = context;
  const debugSource = `initStateAction:`;

  const result = await sendManagerRequest({
    type: CollabRequestType.GetDocument,
    payload: {
      docName: docName,
      userId: userId,
    },
  });

  if (signal.aborted) {
    return;
  }

  if (!result.ok) {
    dispatch(
      {
        type: EventType.InitError,
        payload: { failure: result.body },
      },
      debugSource,
    );
    return;
  }

  const { doc, managerId, version } = result.body;
  dispatch(
    {
      type: EventType.InitDoc,
      payload: {
        doc: schema.nodeFromJSON(doc),
        version,
        managerId,
        selection: undefined,
      },
    },
    debugSource,
  );
  return;
}

async function pullStateAction(
  context: Context,
  dispatch: (event: ValidEvents, debugString?: string) => void,
  logger: (...args: any[]) => void,
  signal: AbortSignal,
  state: PullState,
): Promise<void> {
  const { docName, userId, view, sendManagerRequest } = context;
  const { managerId } = state.state;
  const response = await sendManagerRequest({
    type: CollabRequestType.PullEvents,
    payload: {
      version: getVersion(view.state),
      docName: docName,
      userId: userId,
      managerId: managerId,
    },
  });
  if (signal.aborted) {
    return;
  }
  const debugSource = `pullStateAction:`;

  if (response.ok) {
    applySteps(view, response.body, logger);
    dispatch(
      {
        type: EventType.Ready,
      },
      debugSource,
    );
  } else {
    dispatch(
      {
        type: EventType.PushPullError,
        payload: { failure: response.body },
      },
      debugSource,
    );
  }
  return;
}

function handleErrorStateAction(
  context: Context,
  dispatch: (event: ValidEvents, debugString?: string) => void,
  logger: (...args: any[]) => void,
  signal: AbortSignal,
  state: PushPullErrorState | InitErrorState,
): void {
  const failure = state.state.failure;
  logger('Recovering failure', failure);

  const debugSource = `pushPullErrorStateAction:${failure}:`;

  switch (failure) {
    // 400, 410
    case CollabFail.InvalidVersion:
    case CollabFail.IncorrectManager: {
      abortableSetTimeout(
        () => {
          if (!signal.aborted) {
            dispatch(
              {
                type: EventType.Restart,
              },
              debugSource,
            );
          }
        },
        signal,
        context.retryWaitTime,
      );
      return;
    }
    case CollabFail.HistoryNotAvailable: {
      logger('History/Server not available');
      if (!signal.aborted) {
        dispatch(
          {
            type: EventType.FatalError,
            payload: {
              message: 'History/Server not available',
            },
          },
          debugSource,
        );
      }
      return;
    }
    case CollabFail.DocumentNotFound: {
      logger('Document not found');
      if (!signal.aborted) {
        dispatch(
          {
            type: EventType.FatalError,
            payload: {
              message: 'Document not found',
            },
          },
          debugSource,
        );
      }
      return;
    }
    // 409
    case CollabFail.OutdatedVersion: {
      dispatch(
        {
          type: EventType.Pull,
        },
        debugSource,
      );
      return;
    }

    // 500
    case CollabFail.ApplyFailed: {
      abortableSetTimeout(
        () => {
          if (!signal.aborted) {
            dispatch(
              {
                type: EventType.Pull,
              },
              debugSource,
            );
          }
        },
        signal,
        context.retryWaitTime,
      );

      return;
    }

    default: {
      let val: never = failure;
      throw new Error(`Unknown failure ${failure}`);
    }
  }
}

async function pushStateAction(
  context: Context,
  dispatch: (event: ValidEvents, debugString?: string) => void,
  logger: (...args: any[]) => void,
  signal: AbortSignal,
  state: PushState,
) {
  const { docName, userId, view, sendManagerRequest } = context;
  const debugSource = `pushStateAction:`;

  const steps = sendableSteps(view.state);

  if (!steps) {
    dispatch(
      {
        type: EventType.Ready,
      },
      debugSource + '(no steps):',
    );
    return;
  }

  const { managerId } = state.state;

  const response = await sendManagerRequest({
    type: CollabRequestType.PushEvents,
    payload: {
      version: getVersion(view.state),
      steps: steps ? steps.steps.map((s) => s.toJSON()) : [],
      // TODO  the default value numerical 0 before
      clientID: (steps ? steps.clientID : 0) + '',
      docName: docName,
      userId: userId,
      managerId: managerId,
    },
  });

  if (signal.aborted) {
    return;
  }

  if (response.ok) {
    // Pull changes to confirm our steps and also
    // get any new steps from other clients
    dispatch(
      {
        type: EventType.Pull,
      },
      debugSource,
    );
  } else {
    dispatch(
      {
        type: EventType.PushPullError,
        payload: { failure: response.body },
      },
      debugSource,
    );
  }
  return;
}
