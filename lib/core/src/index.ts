// components
import * as doc from './doc';
import * as editorStateCounter from './editor-state-counter';
import * as history from './history';
import * as paragraph from './paragraph';
import * as text from './text';

export * from './bangle-editor';
export * from './bangle-editor-state';
export * from './create-element';
export * from './dom-serialization-helpers';
export * from './node-view';
export * from './plugin';
export type { RawPlugins } from './plugin-loader';
export * from './spec-registry';

export { doc, editorStateCounter, history, paragraph, text };
export const criticalComponents = {
  doc,
  paragraph,
  text,
  history,
  editorStateCounter,
};
