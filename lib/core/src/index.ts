// components
import * as doc from './doc';
import * as paragraph from './paragraph';
import * as text from './text';
import * as history from './history';
import * as editorStateCounter from './editor-state-counter';

export * from './bangle-editor';
export * from './bangle-editor-state';
export * from './create-element';
export * from './node-view';
export * from './plugin';
export * from './spec-registry';
export * from './dom-serialization-helpers';
export type { RawPlugins } from './plugin-loader';

export { doc, paragraph, text, history, editorStateCounter };

export const criticalComponents = {
  doc,
  paragraph,
  text,
  history,
  editorStateCounter,
};
