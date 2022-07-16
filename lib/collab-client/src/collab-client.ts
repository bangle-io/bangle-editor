import { getVersion, sendableSteps } from 'prosemirror-collab';

import {
  CollabFail,
  CollabManager,
  CollabRequestType,
} from '@bangle.dev/collab-server';
import { EditorState, EditorView, Plugin } from '@bangle.dev/pm';
import { abortableSetTimeout, isTestEnv } from '@bangle.dev/utils';

import {
  dispatchCollabPluginEvent,
  isCollabStateReady,
  isNoEditState,
  isOutdatedVersion,
  onLocalChanges,
} from './commands';
import {
  collabClientKey,
  CollabPluginContext,
  CollabPluginState,
  CollabSettings,
  collabSettingsKey,
  CollabStateName,
  EventType,
  InitErrorState,
  InitState,
  PullState,
  PushPullErrorState,
  PushState,
  TrMeta,
  ValidEvents,
  ValidStates as ValidCollabStates,
} from './common';
import { applyDoc, applySteps } from './helpers';

const LOG = true;
let log = (isTestEnv ? false : LOG)
  ? console.debug.bind(console, `collab-client:`)
  : () => {};

interface ClientInfo {
  readonly clientID: string;
  readonly docName: string;
  readonly retryWaitTime: number;
  readonly sendManagerRequest: CollabManager['handleRequest'];
  readonly userId: string;
}

export function collabClientPlugin(clientInfo: ClientInfo) {
  const logger =
    (state: EditorState) =>
    (...args: any[]) =>
      log(
        `${clientInfo.clientID}:version=${getVersion(state)}:${
          collabClientKey.getState(state)?.context.debugInfo ?? ''
        }`,
        ...args,
      );

  return [
    new Plugin({
      key: collabClientKey,
      filterTransaction(tr, state) {
        // Do not block collab plugins' transactions
        if (
          tr.getMeta(collabClientKey) ||
          tr.getMeta(collabSettingsKey) ||
          tr.getMeta('bangle.dev/isRemote')
        ) {
          return true;
        }

        // prevent any other tr until state is in one of the no-edit state
        if (tr.docChanged && isNoEditState()(state)) {
          logger(state)('skipping transaction');
          return false;
        }

        return true;
      },
      state: {
        init(): CollabPluginState {
          return {
            context: {
              restartCount: 0,
              debugInfo: undefined,
            },
            collabState: { name: CollabStateName.Init },
          };
        },
        apply(tr, value, oldState, newState) {
          const meta: TrMeta | undefined = tr.getMeta(collabClientKey);

          if (meta === undefined) {
            return value;
          }
          let result: CollabPluginState = {
            ...value,
            context: {
              ...value.context,
              // unset debugInfo everytime
              debugInfo: undefined,
            },
          };

          if (meta.collabEvent) {
            const newPluginState = applyState(
              value.collabState,
              meta.collabEvent,
              logger(newState),
            );
            if (newPluginState.name !== value.collabState.name) {
              result.collabState = newPluginState;
            } else {
              logger(newState)(
                'applyState',
                `debugInfo=${result.context.debugInfo}`,
                `event ${meta.collabEvent.type} ignored`,
              );
            }
          }

          if (meta.context) {
            result.context = { ...result.context, ...meta.context };
          }

          logger(newState)(
            'apply state, newStateName=',
            result.collabState.name,
            `debugInfo=${result.context.debugInfo}`,
            'oldStateName=',
            value.collabState.name,
          );

          return result;
        },
      },

      view(view) {
        let controller = new AbortController();
        const pluginState = collabClientKey.getState(view.state);
        if (pluginState) {
          runActions(
            clientInfo,
            pluginState.collabState,
            pluginState.context,
            view,
            controller.signal,
            logger(view.state),
          );
        }

        return {
          destroy() {
            controller.abort();
          },
          update(view, prevState) {
            const pluginState = collabClientKey.getState(view.state);

            // ignore running actions if collab state didn't change
            if (
              pluginState?.collabState ===
              collabClientKey.getState(prevState)?.collabState
            ) {
              return;
            }

            if (pluginState) {
              controller.abort();
              controller = new AbortController();
              runActions(
                clientInfo,
                pluginState.collabState,
                pluginState.context,
                view,
                controller.signal,
                logger(view.state),
              );
            }
          },
        };
      },
    }),
    new Plugin({
      key: collabSettingsKey,
      state: {
        init: (_, _state): CollabSettings => {
          return {
            serverVersion: undefined,
          };
        },
        apply: (tr, value, oldState, newState) => {
          const meta = tr.getMeta(collabSettingsKey);
          if (meta) {
            logger(newState)('collabSettingsKey received tr', meta);
            return {
              ...value,
              ...meta,
            };
          }
          return value;
        },
      },
      view(view) {
        // // If there are sendable steps to send to server
        if (sendableSteps(view.state)) {
          onLocalChanges()(view.state, view.dispatch);
        }
        return {
          update(view) {
            if (
              isOutdatedVersion()(view.state) &&
              isCollabStateReady()(view.state)
            ) {
              dispatchCollabPluginEvent({
                context: {
                  debugInfo: 'collabSettingsKey(outdated-local-version)',
                },
                collabEvent: {
                  type: EventType.Pull,
                },
              })(view.state, view.dispatch);
            }

            // // If there are sendable steps to send to server
            if (sendableSteps(view.state)) {
              onLocalChanges()(view.state, view.dispatch);
            }
          },
        };
      },
    }),
  ];
}

// Must be kept pure -- no side effects
export function applyState(
  state: ValidCollabStates,
  event: ValidEvents,
  logger: (...args: any[]) => void,
): ValidCollabStates {
  const logIgnoreEvent = (state: ValidCollabStates, event: ValidEvents) => {
    logger(
      'applyState:',
      `Ignoring event ${event.type} in state ${state.name}`,
    );
  };

  const stateName = state.name;

  switch (stateName) {
    // FatalError is terminal and should not allow at state transitions
    case CollabStateName.FatalError: {
      logIgnoreEvent(state, event);
      return state;
    }

    case CollabStateName.InitDoc: {
      if (event.type === EventType.Ready) {
        return { name: CollabStateName.Ready, state: state.state };
      }

      logIgnoreEvent(state, event);
      return state;
    }

    case CollabStateName.InitError: {
      if (event.type === EventType.Restart) {
        return { name: CollabStateName.Init };
      } else if (event.type === EventType.FatalError) {
        return {
          name: CollabStateName.FatalError,
          state: { message: event.payload.message },
        };
      }

      logIgnoreEvent(state, event);
      return state;
    }

    case CollabStateName.Init: {
      if (event.type === EventType.InitDoc) {
        const { payload } = event;
        return {
          name: CollabStateName.InitDoc,
          state: {
            initialDoc: payload.doc,
            initialSelection: payload.selection,
            initialVersion: payload.version,
            managerId: payload.managerId,
          },
        };
      } else if (event.type === EventType.InitError) {
        return {
          name: CollabStateName.InitError,
          state: { failure: event.payload.failure },
        };
      }

      logIgnoreEvent(state, event);
      return state;
    }

    case CollabStateName.Pull: {
      if (event.type === EventType.Ready) {
        return { name: CollabStateName.Ready, state: state.state };
      } else if (event.type === EventType.PushPullError) {
        return {
          name: CollabStateName.PushPullError,
          state: {
            failure: event.payload.failure,
            initDocState: state.state,
          },
        };
      }

      logIgnoreEvent(state, event);
      return state;
    }

    case CollabStateName.PushPullError: {
      if (event.type === EventType.Restart) {
        return { name: CollabStateName.Init };
      } else if (event.type === EventType.Pull) {
        return { name: CollabStateName.Pull, state: state.state.initDocState };
      } else if (event.type === EventType.FatalError) {
        return {
          name: CollabStateName.FatalError,
          state: { message: event.payload.message },
        };
      }

      logIgnoreEvent(state, event);
      return state;
    }

    case CollabStateName.Push: {
      if (event.type === EventType.Ready) {
        return { name: CollabStateName.Ready, state: state.state };
      } else if (event.type === EventType.Pull) {
        return { name: CollabStateName.Pull, state: state.state };
      } else if (event.type === EventType.PushPullError) {
        return {
          name: CollabStateName.PushPullError,
          state: {
            failure: event.payload.failure,
            initDocState: state.state,
          },
        };
      }

      logIgnoreEvent(state, event);
      return state;
    }

    case CollabStateName.Ready: {
      if (event.type === EventType.Push) {
        return { name: CollabStateName.Push, state: state.state };
      } else if (event.type === EventType.Pull) {
        return { name: CollabStateName.Pull, state: state.state };
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
  clientInfo: ClientInfo,
  collabState: ValidCollabStates,
  context: CollabPluginContext,
  view: EditorView,
  signal: AbortSignal,
  logger: (...args: any[]) => void,
): Promise<void> {
  if (signal.aborted) {
    return;
  }

  const stateName = collabState.name;

  logger(`running action for ${stateName}, context=`, context);

  const debugString = `runActions:${stateName}`;

  const base = {
    clientInfo,
    context: context,
    logger,
    signal,
    view,
  };
  switch (stateName) {
    case CollabStateName.FatalError: {
      logger(
        `Freezing document(${clientInfo.docName}) to prevent further edits due to FatalError`,
      );
      return;
    }
    case CollabStateName.InitDoc: {
      const { initialDoc, initialVersion, initialSelection } =
        collabState.state;

      if (!signal.aborted) {
        applyDoc(view, initialDoc, initialVersion, initialSelection);
        dispatchCollabPluginEvent({
          collabEvent: {
            type: EventType.Ready,
          },
          context: {
            debugInfo: debugString,
          },
        })(view.state, view.dispatch);
      }
      return;
    }

    case CollabStateName.InitError: {
      return handleErrorStateAction({ ...base, collabState });
    }

    case CollabStateName.Init: {
      return initStateAction({ ...base, collabState });
    }

    case CollabStateName.Pull: {
      return pullStateAction({ ...base, collabState });
    }

    case CollabStateName.PushPullError: {
      return handleErrorStateAction({ ...base, collabState });
    }

    case CollabStateName.Push: {
      return pushStateAction({ ...base, collabState });
    }

    // Ready state is a special state where pending changes are dispatched
    // or if no pending changes, it waits for new changes.
    case CollabStateName.Ready: {
      if (!signal.aborted) {
        if (isOutdatedVersion()(view.state)) {
          dispatchCollabPluginEvent({
            context: {
              ...context,
              debugInfo: debugString + '(outdated-local-version)',
            },
            collabEvent: {
              type: EventType.Pull,
            },
          })(view.state, view.dispatch);
        } else if (sendableSteps(view.state)) {
          dispatchCollabPluginEvent({
            context: {
              ...context,
              debugInfo: debugString + '(sendable-steps)',
            },
            collabEvent: {
              type: EventType.Push,
            },
          })(view.state, view.dispatch);
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

type CollabAction<T extends ValidCollabStates> = (param: {
  clientInfo: ClientInfo;
  context: CollabPluginContext;
  logger: (...args: any[]) => void;
  signal: AbortSignal;
  collabState: T;
  view: EditorView;
}) => Promise<void>;

const initStateAction: CollabAction<InitState> = async ({
  clientInfo,
  context,
  logger,
  signal,
  view,
}) => {
  const { docName, userId, sendManagerRequest } = clientInfo;
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
    dispatchCollabPluginEvent({
      collabEvent: {
        type: EventType.InitError,
        payload: { failure: result.body },
      },
      context: { debugInfo: debugSource },
    })(view.state, view.dispatch);
    return;
  }

  const { doc, managerId, version } = result.body;
  dispatchCollabPluginEvent({
    context: { debugInfo: debugSource },
    collabEvent: {
      type: EventType.InitDoc,
      payload: {
        doc: view.state.schema.nodeFromJSON(doc),
        version,
        managerId,
        selection: undefined,
      },
    },
  })(view.state, view.dispatch);

  return;
};

const pullStateAction: CollabAction<PullState> = async ({
  clientInfo,
  logger,
  signal,
  collabState,
  view,
}) => {
  const { docName, userId, sendManagerRequest } = clientInfo;
  const { managerId } = collabState.state;
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
    dispatchCollabPluginEvent({
      context: { debugInfo: debugSource },
      collabEvent: {
        type: EventType.Ready,
      },
    })(view.state, view.dispatch);
  } else {
    dispatchCollabPluginEvent({
      context: { debugInfo: debugSource },
      collabEvent: {
        type: EventType.PushPullError,
        payload: { failure: response.body },
      },
    })(view.state, view.dispatch);
  }
  return;
};

const handleErrorStateAction: CollabAction<
  PushPullErrorState | InitErrorState
> = async ({ clientInfo, view, logger, signal, collabState }) => {
  const failure = collabState.state.failure;
  logger('Recovering failure', failure);

  const debugSource = `pushPullErrorStateAction:${failure}:`;

  switch (failure) {
    case CollabFail.InvalidVersion:
    case CollabFail.IncorrectManager: {
      abortableSetTimeout(
        () => {
          if (!signal.aborted) {
            dispatchCollabPluginEvent({
              context: { debugInfo: debugSource },
              collabEvent: {
                type: EventType.Restart,
              },
            })(view.state, view.dispatch);
          }
        },
        signal,
        clientInfo.retryWaitTime,
      );
      return;
    }
    case CollabFail.HistoryNotAvailable: {
      logger('History/Server not available');
      if (!signal.aborted) {
        dispatchCollabPluginEvent({
          context: { debugInfo: debugSource },
          collabEvent: {
            type: EventType.FatalError,
            payload: {
              message: 'History/Server not available',
            },
          },
        })(view.state, view.dispatch);
      }
      return;
    }
    case CollabFail.DocumentNotFound: {
      logger('Document not found');
      if (!signal.aborted) {
        dispatchCollabPluginEvent({
          collabEvent: {
            type: EventType.FatalError,
            payload: {
              message: 'Document not found',
            },
          },
          context: { debugInfo: debugSource },
        })(view.state, view.dispatch);
      }
      return;
    }
    // 409
    case CollabFail.OutdatedVersion: {
      dispatchCollabPluginEvent({
        collabEvent: {
          type: EventType.Pull,
        },
        context: { debugInfo: debugSource },
      })(view.state, view.dispatch);
      return;
    }

    // 500
    case CollabFail.ApplyFailed: {
      abortableSetTimeout(
        () => {
          if (!signal.aborted) {
            dispatchCollabPluginEvent({
              collabEvent: {
                type: EventType.Pull,
              },
              context: { debugInfo: debugSource },
            })(view.state, view.dispatch);
          }
        },
        signal,
        clientInfo.retryWaitTime,
      );

      return;
    }

    default: {
      let val: never = failure;
      throw new Error(`Unknown failure ${failure}`);
    }
  }
};

const pushStateAction: CollabAction<PushState> = async ({
  clientInfo,
  signal,
  collabState,
  view,
}) => {
  const { docName, userId, sendManagerRequest } = clientInfo;
  const debugSource = `pushStateAction:`;

  const steps = sendableSteps(view.state);

  if (!steps) {
    dispatchCollabPluginEvent({
      collabEvent: {
        type: EventType.Ready,
      },
      context: { debugInfo: debugSource + '(no steps):' },
    })(view.state, view.dispatch);
    return;
  }

  const { managerId } = collabState.state;

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
    dispatchCollabPluginEvent({
      collabEvent: {
        type: EventType.Pull,
      },
      context: { debugInfo: debugSource },
    })(view.state, view.dispatch);
  } else {
    dispatchCollabPluginEvent({
      collabEvent: {
        type: EventType.PushPullError,
        payload: { failure: response.body },
      },
      context: { debugInfo: debugSource },
    })(view.state, view.dispatch);
  }
  return;
};
