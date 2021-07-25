import browser from './utils/browser';
import * as logging from './utils/logging';
import * as utils from './utils/utils';

// components
import * as doc from './base-components/doc';
import * as paragraph from './base-components/paragraph';
import * as text from './base-components/text';
import * as history from './base-components/history';
import * as editorStateCounter from './base-components/editor-state-counter';

export * from './bangle-editor';
export * from './bangle-editor-state';
export * from './core-commands';
export * from './create-element';
export * from './node-view';
export * from './plugin';
export * from './spec-registry';
export * from './utils/dom-serialization-helpers';
export * from './utils/plugin-key-store';
export type { RawPlugins } from './utils/plugin-loader';

// TODO remove me
export { pluginLoader } from './utils/plugin-loader';

const baseComponents = {
  doc,
  paragraph,
  text,
  history,
  editorStateCounter,
};

const isChromeWithSelectionBug =
  browser.chrome && !browser.android && browser.chrome_version >= 58;

export { utils, logging, browser, isChromeWithSelectionBug, baseComponents };
