import { getVersion, sendableSteps } from 'prosemirror-collab';

import { EditorState, EditorView, Plugin } from '@bangle.dev/pm';
import { isTestEnv } from '@bangle.dev/utils';

import {
  isOutdatedVersion,
  onLocalChanges,
  onOutdatedVersion,
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
} from './common';
import { getCollabState } from './helpers';
import { CollabBaseState, InitState } from './state';

const LOG = true;
let log = (isTestEnv ? true : LOG)
  ? console.debug.bind(console, `collab-client:`)
  : () => {};

const collabMonitorInitialState = {
  serverVersion: undefined,
};

export function collabClientPlugin(clientInfo: ClientInfo) {
  const logger =
    (state: EditorState) =>
    (...args: any[]) =>
      log(
        `${clientInfo.clientID}:version=${getVersion(state)}:debugInfo=${
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
            };
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

            return {
              ...value,
              collabState: newCollabState,
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
        let controller = new AbortController();
        const pluginState = collabClientKey.getState(view.state);
        if (pluginState) {
          pluginState.collabState.runAction({
            clientInfo,
            view,
            signal: controller.signal,
            logger: logger(view.state),
          });
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
              pluginState.collabState.runAction({
                clientInfo,
                view,
                signal: controller.signal,
                logger: logger(view.state),
              });
            }
          },
        };
      },
    }),
    new Plugin({
      key: collabMonitorKey,
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
          // There are two ways different ways this extension keeps a check on outdated version (needs to pull)
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
