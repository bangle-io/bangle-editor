import { objectFilter } from 'bangle-core/utils/js-utils';

export class Extension {
  constructor(options = {}) {
    this.options = {
      ...this.defaultOptions,
      // prevent undefined from overwriting default values
      ...objectFilter(options, (value) => value !== undefined),
    };
  }

  init() {
    return null;
  }

  // TODO remove this extension instance should not be stateful
  bindEditor(editor = null) {
    this.editor = editor;
  }

  get name() {
    return null;
  }

  get type() {
    return 'extension';
  }

  get update() {
    return () => {};
  }

  get defaultOptions() {
    return {};
  }

  get plugins() {
    return [];
  }

  inputRules() {
    return [];
  }

  pasteRules() {
    return [];
  }

  keys() {
    return {};
  }
}
