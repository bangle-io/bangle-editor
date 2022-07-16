import { getVersion } from 'prosemirror-collab';

import { Command, EditorState } from '@bangle.dev/pm';

import {
  collabClientKey,
  collabSettingsKey,
  CollabStateName,
  EventType,
  TrMeta,
} from './common';

// In the following states, the user is not allowed to edit the document.
const NoEditStates = [
  CollabStateName.Init,
  CollabStateName.InitDoc,
  CollabStateName.FatalError,
];

export function dispatchCollabPluginEvent(data: TrMeta): Command {
  return (state, dispatch) => {
    dispatch?.(state.tr.setMeta(collabClientKey, data));
    return true;
  };
}

export function onUpstreamChanges(version: number): Command {
  return (state, dispatch) => {
    const pluginState = collabSettingsKey.getState(state);
    if (!pluginState) {
      return false;
    }

    if (pluginState.serverVersion !== version) {
      dispatch?.(
        state.tr.setMeta(collabSettingsKey, { serverVersion: version }),
      );
    }

    return false;
  };
}

export function onLocalChanges(): Command {
  return (state, dispatch) => {
    const pluginState = collabClientKey.getState(state);
    if (!pluginState) {
      return false;
    }

    if (isCollabStateReady()(state)) {
      dispatchCollabPluginEvent({
        context: {
          debugInfo: 'onLocalChanges',
        },
        collabEvent: {
          type: EventType.Push,
        },
      })(state, dispatch);
      return true;
    }

    return false;
  };
}

export function isOutdatedVersion() {
  return (state: EditorState): boolean => {
    const serverVersion = collabSettingsKey.getState(state)?.serverVersion;
    return (
      typeof serverVersion === 'number' && getVersion(state) < serverVersion
    );
  };
}

export function isCollabStateReady() {
  return (state: EditorState): boolean => {
    return (
      collabClientKey.getState(state)?.collabState.name ===
      CollabStateName.Ready
    );
  };
}

// In these states the document is frozen and no edits and _almost_ no transactions are allowed
export function isNoEditState() {
  return (state: EditorState): boolean => {
    const stateName = collabClientKey.getState(state)?.collabState.name;
    return stateName ? NoEditStates.includes(stateName) : false;
  };
}
