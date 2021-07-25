// components
import * as doc from './base-components/doc';
import * as paragraph from './base-components/paragraph';
import * as text from './base-components/text';
import * as history from './base-components/history';
import * as editorStateCounter from './base-components/editor-state-counter';

export * from './bangle-editor';
export * from './bangle-editor-state';
export * from './create-element';
export * from './node-view';
export * from './plugin';
export * from './spec-registry';
export * from './dom-serialization-helpers';
export type { RawPlugins } from './plugin-loader';

export const baseComponents = {
  doc,
  paragraph,
  text,
  history,
  editorStateCounter,
};
