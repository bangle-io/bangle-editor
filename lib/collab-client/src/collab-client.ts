import { getVersion, sendableSteps } from 'prosemirror-collab';

import { EditorState, Plugin } from '@bangle.dev/pm';
import { isTestEnv } from '@bangle.dev/utils';

import {
  dispatchCollabPluginEvent,
  isCollabStateReady,
  isNoEditState,
  isOutdatedVersion,
  onLocalChanges,
} from './commands';
import {
  ClientInfo,
  collabClientKey,
  CollabPluginState,
  CollabSettings,
  collabSettingsKey,
  EventType,
  TrMeta,
} from './common';
import { InitState2 } from './state';

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
            collabState: new InitState2(),
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
            const newPluginState = value.collabState.transition(
              meta.collabEvent,
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
          pluginState.collabState.runAction({
            clientInfo,
            context: pluginState.context,
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
                context: pluginState.context,
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
