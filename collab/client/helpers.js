import { Selection } from '@bangle.dev/core/prosemirror/state';
const LOG = false;

let log = LOG ? console.log.bind(console, 'collab/helpers') : () => {};

export function replaceDocument(state, doc, version) {
  const { schema, tr } = state;
  const content = (doc.content || []).map((child) =>
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
