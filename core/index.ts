import * as components from './components/components';
import browser from './utils/browser';
import * as logging from './utils/logging';
import * as utils from './utils/utils';

export * from './bangle-editor';
export * from './bangle-editor-state';
export * from './components/components';
export * from './core-commands';
export * from './create-element';
export * from './node-view';
export * from './plugin';
export * from './spec-registry';
export * from './utils/core-components';
export * from './utils/dom-serialization-helpers';
export * from './utils/plugin-key-store';

const isChromeWithSelectionBug =
  browser.chrome && !browser.android && browser.chrome_version >= 58;

export { components, utils, logging, browser, isChromeWithSelectionBug };
