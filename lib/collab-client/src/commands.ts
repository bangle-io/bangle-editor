import { getVersion } from 'prosemirror-collab';

import { Command, EditorState } from '@bangle.dev/pm';

import { collabMonitorKey, CollabMonitorTrMeta, EventType } from './common';
import { getCollabState } from './helpers';

// Saves the server version of the document. Rest of the code
// then uses this information to determine whether to pull from server or not.
export function onUpstreamChanges(version: number): Command {
  return (state, dispatch) => {
    const pluginState = collabMonitorKey.getState(state);
    if (!pluginState) {
      return false;
    }

    if (pluginState.serverVersion !== version) {
      const meta: CollabMonitorTrMeta = { serverVersion: version };
      dispatch?.(state.tr.setMeta(collabMonitorKey, meta));
      return true;
    }

    return false;
  };
}

export function onLocalChanges(): Command {
  return (state, dispatch) => {
    const collabState = getCollabState(state);
    if (collabState?.isReadyState()) {
      collabState?.dispatch(
        state,
        dispatch,
        {
          type: EventType.Push,
        },
        'onLocalChanges',
      );
      return true;
    }
    return false;
  };
}

export function isOutdatedVersion() {
  return (state: EditorState): boolean => {
    const serverVersion = collabMonitorKey.getState(state)?.serverVersion;
    return (
      typeof serverVersion === 'number' && getVersion(state) < serverVersion
    );
  };
}

export function onOutdatedVersion(): Command {
  return (state, dispatch) => {
    const collabState = getCollabState(state);
    if (collabState?.isReadyState()) {
      collabState.dispatch(
        state,
        dispatch,
        {
          type: EventType.Pull,
        },
        'collabMonitorKey(outdated-local-version)',
      );
      return true;
    }
    return false;
  };
}
