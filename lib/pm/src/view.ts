import type { ResolvedPos, Slice } from 'prosemirror-model';
import type { EditorView } from 'prosemirror-view';
import {
  // @ts-expect-error
  __parseFromClipboard,
  // @ts-expect-error
  __serializeForClipboard,
} from 'prosemirror-view';

export type {
  DecorationAttrs,
  DirectEditorProps,
  EditorProps,
  NodeView,
} from 'prosemirror-view';
export { Decoration, DecorationSet, EditorView } from 'prosemirror-view';

export function parseFromClipboard(
  view: EditorView,
  text: string,
  html: string | null,
  plainText: boolean,
  $context: ResolvedPos
): Slice {
  return __parseFromClipboard(view, text, html, plainText, $context);
}

export function serializeForClipboard(
  view: EditorView,
  slice: Slice
): {
  dom: HTMLDivElement;
  text: string;
} {
  return __serializeForClipboard(view, slice);
}
