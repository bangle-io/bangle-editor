// components
import * as doc from './critical-components/doc';
import * as paragraph from './critical-components/paragraph';
import * as text from './critical-components/text';
import * as history from './critical-components/history';
import * as editorStateCounter from './critical-components/editor-state-counter';

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
