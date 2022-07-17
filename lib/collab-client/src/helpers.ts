import { getVersion, receiveTransaction } from 'prosemirror-collab';

import { PullEventResponse } from '@bangle.dev/collab-server';
import {
  EditorState,
  EditorView,
  Node,
  Selection,
  Step,
  TextSelection,
} from '@bangle.dev/pm';

import { collabClientKey } from './common';

export function applySteps(
  view: EditorView,
  payload: PullEventResponse,
  logger: (...args: any[]) => void,
) {
  if (view.isDestroyed) {
    return;
  }
  // TODO name these steps as rawSteps
  // TODO make sure the data is always []
  const steps = (payload.steps ? payload.steps : []).map((j) =>
    Step.fromJSON(view.state.schema, j),
  );
  const clientIDs = payload.clientIDs ? payload.clientIDs : [];

  if (steps.length === 0) {
    logger('no steps', payload, 'version', getVersion(view.state));
    return false;
  }

  const tr = receiveTransaction(view.state, steps, clientIDs)
    .setMeta('addToHistory', false)
    .setMeta('bangle.dev/isRemote', true);
  const newState = view.state.apply(tr);
  view.updateState(newState);

  logger('after apply version', getVersion(view.state));
  return;
}

export function applyDoc(
  view: EditorView,
  doc: Node,
  version: number,
  oldSelection?: TextSelection,
) {
  if (view.isDestroyed) {
    return;
  }
  const prevSelection =
    view.state.selection instanceof TextSelection
      ? view.state.selection
      : undefined;

  let tr = replaceDocument(view.state, doc, version);
  const selection = oldSelection || prevSelection;
  if (selection) {
    let { from } = selection;
    if (from >= tr.doc.content.size) {
      tr = tr.setSelection(Selection.atEnd(tr.doc));
    } else {
      tr = tr.setSelection(Selection.near(tr.doc.resolve(from)));
    }
  }

  const newState = view.state.apply(tr.setMeta('bangle.dev/isRemote', true));

  view.updateState(newState);
}

function replaceDocument(
  state: EditorState,
  serializedDoc: any,
  version?: number,
) {
  const { schema, tr } = state;
  const content: Node[] =
    // TODO remove serializedDoc
    serializedDoc instanceof Node
      ? serializedDoc.content
      : (serializedDoc.content || []).map((child: any) =>
          schema.nodeFromJSON(child),
        );

  const hasContent = Array.isArray(content)
    ? content.length > 0
    : Boolean(content);

  if (!hasContent) {
    return tr;
  }

  tr.setMeta('addToHistory', false);
  tr.replaceWith(0, state.doc.nodeSize - 2, content);
  tr.setSelection(Selection.atStart(tr.doc));

  if (typeof version !== undefined) {
    const collabState = { version, unconfirmed: [] };
    tr.setMeta('collab$', collabState);
  }

  return tr;
}

export function getCollabState(state: EditorState) {
  return collabClientKey.getState(state)?.collabState;
}
