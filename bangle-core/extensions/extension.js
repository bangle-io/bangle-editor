export class Extension {
  constructor(options = {}) {
    this.options = {
      ...this.defaultOptions,
      ...options,
    };
  }

  init() {
    return null;
  }

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
