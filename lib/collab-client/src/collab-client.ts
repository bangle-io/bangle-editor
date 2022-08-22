import { getVersion, sendableSteps } from 'prosemirror-collab';

import {
  ClientCommunication,
  CollabMessageBus,
} from '@bangle.dev/collab-comms';
import { EditorState, EditorView, Plugin } from '@bangle.dev/pm';
import { isTestEnv } from '@bangle.dev/utils';

import {
  hardResetClient,
  isOutdatedVersion,
  onLocalChanges,
  onOutdatedVersion,
  updateServerVersion,
} from './commands';
import {
  ClientInfo,
  collabClientKey,
  CollabMonitor,
  collabMonitorKey,
  CollabMonitorTrMeta,
  CollabPluginState,
  CollabStateName,
  EventType,
  MAX_STATES_TO_KEEP,
} from './common';
import { getCollabState } from './helpers';
import { CollabBaseState, FatalErrorState, InitState } from './state';

const LOG = true;
let log = (isTestEnv ? false : LOG)
  ? console.debug.bind(console, `collab-client:`)
  : () => {};

const collabMonitorInitialState = {
  serverVersion: undefined,
};

const INFINITE_TRANSITION_SAMPLE = 500;
const INFINITE_TRANSITION_THRESHOLD_TIME = 1000;

export function collabClientPlugin({
  requestTimeout,
  clientID,
  collabMessageBus,
  docName,
  managerId,
  cooldownTime,
  userId,
  warmupTime,
}: {
  requestTimeout?: number;
  clientID: string;
  collabMessageBus: CollabMessageBus;
  docName: string;
  managerId: string;
  cooldownTime: number;
  userId: string;
  warmupTime?: number;
}) {
  const logger =
    (state: EditorState) =>
    (...args: any[]) =>
      log(
        `${clientID}:version=${getVersion(state)}:debugInfo=${
          collabClientKey.getState(state)?.collabState.debugInfo
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
          tr.getMeta(collabMonitorKey) ||
          tr.getMeta('bangle.dev/isRemote')
        ) {
          return true;
        }

        // prevent any other tr while state is in one of the no-edit state
        if (tr.docChanged && getCollabState(state)?.editingAllowed === false) {
          console.debug('@bangle.dev/collab-client blocking transaction');
          return false;
        }

        return true;
      },
      state: {
        init(): CollabPluginState {
          return {
            collabState: new InitState(),
            previousStates: [],
            infiniteTransitionGuard: { counter: 0, lastChecked: 0 },
          };
        },
        apply(tr, value, oldState, newState) {
          const meta:
            | Parameters<CollabBaseState['dispatchCollabPluginEvent']>[0]
            | undefined = tr.getMeta(collabClientKey);

          if (meta === undefined || !meta.collabEvent) {
            return value;
          }

          if (meta.collabEvent.type === EventType.HardReset) {
            logger(newState)(
              'apply state HARD RESET, newStateName=',
              CollabStateName.Init,
              'oldStateName=',
              value.collabState.name,
            );
            return {
              collabState: new InitState(undefined, '(HardReset)'),
              previousStates: [],
              infiniteTransitionGuard: { counter: 0, lastChecked: 0 },
            };
          }

          value.infiniteTransitionGuard.counter++;

          // A guard to prevent infinite transitions in case of a bug
          if (
            value.infiniteTransitionGuard.counter %
              INFINITE_TRANSITION_SAMPLE ===
            0
          ) {
            if (
              Date.now() - value.infiniteTransitionGuard.lastChecked <=
              INFINITE_TRANSITION_THRESHOLD_TIME
            ) {
              queueMicrotask(() => {
                throw new Error(
                  'Stuck in infinite transitions. Last few states: ' +
                    value.previousStates
                      .map(
                        (s) => s.name + (s.debugInfo ? `:${s.debugInfo}` : ''),
                      )
                      .join(', ')
                      .slice(0, 5),
                );
              });

              return {
                collabState: new FatalErrorState(
                  { message: 'Infinite transitions' },
                  '(stuck in infinite transitions)',
                ),
                previousStates: [value.collabState, ...value.previousStates],
                infiniteTransitionGuard: { counter: 0, lastChecked: 0 },
              };
            }
            value.infiniteTransitionGuard.lastChecked = Date.now();
            value.infiniteTransitionGuard.counter = 0;
          }

          const newCollabState = value.collabState.transition(
            meta.collabEvent,
            meta.debugInfo,
          );

          if (!newCollabState) {
            return value;
          }

          if (newCollabState.name !== value.collabState.name) {
            logger(newState)(
              'apply state, newStateName=',
              newCollabState.name,
              `debugInfo=${newCollabState.debugInfo}`,
              'oldStateName=',
              value.collabState.name,
            );

            let previousStates = [value.collabState, ...value.previousStates];

            if (previousStates.length > MAX_STATES_TO_KEEP) {
              previousStates = previousStates.slice(0, MAX_STATES_TO_KEEP);
            }

            if (newCollabState.isFatalState()) {
              console.error(
                `@bangle.dev/collab-client: In FatalErrorState message=${newCollabState.state.message}`,
              );
            }

            return {
              ...value,
              collabState: newCollabState,
              previousStates: previousStates,
            };
          }

          logger(newState)(
            `applyState IGNORE EVENT ${meta.collabEvent.type} due to self transition`,
            `debugInfo=${meta.debugInfo}`,
          );

          return value;
        },
      },

      view(view) {
        let actionController = new AbortController();
        let clientComController = new AbortController();
        let clientCom = new ClientCommunication({
          clientId: clientID,
          managerId,
          docName,
          messageBus: collabMessageBus,
          signal: clientComController.signal,
          requestTimeout: requestTimeout,
          onNewVersion: ({ version }) => {
            updateServerVersion(version)(view.state, view.dispatch);
          },
          onResetClient() {
            hardResetClient()(view.state, view.dispatch);
          },
        });

        const pluginState = collabClientKey.getState(view.state);
        const clientInfo: ClientInfo = {
          clientID,
          docName,
          cooldownTime,
          clientCom,
          managerId,
          userId,
          warmupTime,
        };

        if (pluginState) {
          pluginState.collabState.runAction({
            clientInfo,
            view,
            signal: actionController.signal,
            logger: logger(view.state),
          });
        }

        return {
          destroy() {
            actionController.abort();
            clientComController.abort();
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
              actionController.abort();
              actionController = new AbortController();
              pluginState.collabState.runAction({
                clientInfo,
                view,
                signal: actionController.signal,
                logger: logger(view.state),
              });
            }
          },
        };
      },
    }),
    new Plugin({
      key: collabMonitorKey,
      props: {
        attributes: (state: any) => {
          const editingAllowed = getCollabState(state)?.editingAllowed;
          return {
            class: editingAllowed
              ? 'bangle-collab-active'
              : 'bangle-collab-frozen',
          };
        },
      },
      state: {
        init: (_, _state): CollabMonitor => {
          return collabMonitorInitialState;
        },
        apply: (tr, value, oldState, newState): CollabMonitor => {
          const meta: CollabMonitorTrMeta | undefined =
            tr.getMeta(collabMonitorKey);
          if (meta) {
            logger(newState)('collabMonitorKey received tr', meta);
            return {
              ...value,
              ...meta,
            };
          }

          // Reset collab monitors state if collab state is restarted
          if (getCollabState(newState)?.name === CollabStateName.Init) {
            return collabMonitorInitialState;
          }

          return value;
        },
      },
      view(view) {
        const check = (view: EditorView) => {
          // There are two ways different ways this extension keeps a check on outdated version (aka - needs to pull)
          // and sendable steps (needs to push):
          // 1. the ready state action which gets triggered when collabClientKey plugin transitions
          //    to the ready state.
          // 2. this plugin (collabMonitorKey) which runs `check` every time the view is updated and
          //    checks if we need a push or pull.

          // outdated version gets a priority over local changes
          if (isOutdatedVersion()(view.state)) {
            onOutdatedVersion()(view.state, view.dispatch);
          }
          // If there are sendable steps to send to server
          else if (sendableSteps(view.state)) {
            onLocalChanges()(view.state, view.dispatch);
          }
        };

        check(view);
        return {
          update(view) {
            check(view);
          },
        };
      },
    }),
  ];
}
