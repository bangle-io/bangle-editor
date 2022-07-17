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
} from './common';
import { getCollabState } from './helpers';
import { CollabBaseState, InitState } from './state';

const LOG = true;
let log = (isTestEnv ? false : LOG)
  ? console.debug.bind(console, `collab-client:`)
  : () => {};

export function collabClientPlugin(clientInfo: ClientInfo) {
  const logger =
    (state: EditorState) =>
    (...args: any[]) =>
      log(
        `${clientInfo.clientID}:version=${getVersion(state)}:${
          collabClientKey.getState(state)?.collabState.debugInfo ?? ''
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

        // prevent any other tr until state is in one of the no-edit state
        if (tr.docChanged && getCollabState(state)?.editingAllowed === false) {
          logger(state)('skipping transaction');
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

          if (meta === undefined) {
            return value;
          }

          let result: CollabPluginState = {
            ...value,
          };

          if (meta.collabEvent) {
            const newPluginState = value.collabState.transition(
              meta.collabEvent,
            );

            if (newPluginState.name !== value.collabState.name) {
              result.collabState = newPluginState;
            } else {
              logger(newState)(
                `applyState IGNORE EVENT ${meta.collabEvent.type}`,
                `debugInfo=${result.collabState.debugInfo}`,
              );
            }
          }

          logger(newState)(
            'apply state, newStateName=',
            result.collabState.name,
            `debugInfo=${result.collabState.debugInfo}`,
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
          return {
            serverVersion: undefined,
          };
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
          return value;
        },
      },
      view(view) {
        const check = (view: EditorView) => {
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
