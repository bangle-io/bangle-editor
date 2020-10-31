import {
  EditorState,
  Plugin,
  PluginKey,
  TextSelection,
} from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser, DOMSerializer } from 'prosemirror-model';
import { dropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { inputRules, undoInputRule } from 'prosemirror-inputrules';

import { ExtensionManager } from './utils/extension-manager';
import { Emitter } from './utils/emitter';
import { Text, Paragraph, Doc } from './nodes/index';
import { CustomNodeView } from './helper-react/custom-node-view';
import {
  getMarkAttrs,
  findChangedNodesFromTransaction,
  isMarkActiveInSelection,
  nodeIsActive,
} from './utils/pm-utils';
window.PluginKey = PluginKey;
const LOG = false;

function log(...args) {
  if (LOG) {
    console.log('editor.js', ...args);
  }
}

const EVENTS = [
  'init',
  'transaction',
  'update',
  'focus',
  'blur',
  'paste',
  'drop',
];

export class Editor extends Emitter {
  constructor(domElement, options = {}) {
    super();

    const defaultOptions = {
      manualViewCreate: null, // allow for customization of when the view is created
      renderNodeView: null,
      destroyNodeView: null,
      editorProps: {},
      editable: true,
      autoFocus: null,
      extensions: [],
      content: '',
      topNode: 'doc',
      doc: null,
      selection: null,
      emptyDocument: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
          },
        ],
      },
      useBuiltInExtensions: true,
      disableInputRules: false,
      disablePasteRules: false,
      dropCursor: {},
      parseOptions: {},
      // these are used
      onInit: () => {},
      onTransaction: () => {},
      onUpdate: () => {},
      onFocus: () => {},
      onBlur: () => {},
      onPaste: () => {},
      onDrop: () => {},
    };

    this.init(domElement, { ...defaultOptions, ...options });
  }

  init(domElement, options = {}) {
    this.setOptions(options);
    this.focused = false;
    this.selection = this.options.selection
      ? { from: this.options.selection.from, to: this.options.selection.to }
      : { from: 0, to: 0 };
    this.element = domElement; //document.createElement('div');
    this.extensions = this.createExtensions();
    this.nodes = this.createNodes();
    this.marks = this.createMarks();
    this.schema = this.createSchema();
    this.plugins = this.createPlugins();
    this.keymaps = this.createKeymaps();
    this.inputRules = this.createInputRules();
    this.pasteRules = this.createPasteRules();
    this.nodeViews = this.initNodeViews();
    // TODO this `manualViewCreate` needs to be fixed
    // do we need to couple the editor setup in one huge chunk
    //   i kind of like the flexibility of PM setup which allows for decoupling
    // of state creation from view, allowing you to get schema without creating view
    const viewSetup = () => {
      this.view = this.createView();
      this.commands = this.createCommands(); // setting command after view is important
      this.setActiveNodesAndMarks();

      if (this.options.autoFocus !== null) {
        this.focus(this.options.autoFocus);
      }

      EVENTS.forEach((name) => {
        this.on(name, this.options[toCamelCase(`on ${name}`)] || (() => {}));
      });

      this.emit('init', {
        view: this.view,
        state: this.state,
        editor: this,
      });

      // give extension manager access to our view
      this.extensions.view = this.view;

      if (this.viewSetup) {
        this.viewSetup = null;
      }
      log('editor setup');
    };

    if (this.options.manualViewCreate) {
      this.viewSetup = viewSetup;
    } else {
      viewSetup();
    }
  }

  setOptions(options) {
    this.options = {
      ...this.options,
      ...options,
    };

    if (this.view && this.state) {
      this.view.updateState(this.state);
    }
  }

  get builtInExtensions() {
    if (!this.options.useBuiltInExtensions) {
      return [];
    }

    return [new Doc(), new Text(), new Paragraph()];
  }

  get state() {
    return this.view ? this.view.state : null;
  }

  createExtensions() {
    return new ExtensionManager(
      [...this.builtInExtensions, ...this.options.extensions],
      this,
    );
  }

  createPlugins() {
    return this.extensions.plugins;
  }

  createKeymaps() {
    return this.extensions.keymaps({
      schema: this.schema,
    });
  }

  createInputRules() {
    return this.extensions.inputRules({
      schema: this.schema,
      excludedExtensions: this.options.disableInputRules,
    });
  }

  createPasteRules() {
    return this.extensions.pasteRules({
      schema: this.schema,
      excludedExtensions: this.options.disablePasteRules,
    });
  }

  createCommands() {
    return this.extensions.commands({
      schema: this.schema,
      view: this.view,
    });
  }

  createNodes() {
    return this.extensions.nodes;
  }

  createMarks() {
    return this.extensions.marks;
  }

  createSchema() {
    // TODO Was thinking of making attributes of only string or null type
    // Object.entries({ ...this.nodes, ...this.marks }).forEach(
    //   ([name, { attrs }]) => {
    //     if (!attrs) {
    //       return;
    //     }
    //     Object.entries(attrs).forEach(([attr, val]) => {
    //       if (!hasOwnProperty(val, 'default')) {
    //         throw new Error(`${name}'s attribute ${attr} need a default value`);
    //       }
    //       const defaultVal = val.default;
    //       console.log(defaultVal);
    //       if (
    //         defaultVal === undefined ||
    //         defaultVal === null ||
    //         typeof defaultVal === 'string'
    //       ) {
    //         return;
    //       }

    //       throw new Error(
    //         `${name}'s attribute ${attr} must be of 'null', 'undefined', or a string`,
    //       );
    //     });
    //     // debugger;
    //   },
    // );
    return new Schema({
      topNode: this.options.topNode,
      nodes: this.nodes,
      marks: this.marks,
    });
  }

  createState() {
    const settings = {
      schema: this.schema,
      doc: this.options.doc || this.createDocument(this.options.content),
      plugins: [
        ...this.plugins,
        inputRules({
          rules: this.inputRules,
        }),
        ...this.pasteRules,
        ...this.keymaps,
        keymap({
          Backspace: undoInputRule,
        }),
        keymap(baseKeymap),
        dropCursor(this.options.dropCursor),
        gapCursor(),
        new Plugin({
          key: new PluginKey('editable'),
          props: {
            editable: () => this.options.editable, // TODO check if this means this can be grabbed from view.editable
          },
        }),
        new Plugin({
          props: {
            attributes: {
              tabindex: 0,
            },
            handleDOMEvents: {
              focus: (view, event) => {
                this.focused = true;
                this.emit('focus', {
                  event,
                  state: view.state,
                  view,
                });

                const transaction = this.state.tr.setMeta('focused', true);
                this.view.dispatch(transaction);
              },
              blur: (view, event) => {
                this.focused = false;
                this.emit('blur', {
                  event,
                  state: view.state,
                  view,
                });

                const transaction = this.state.tr.setMeta('focused', false);
                this.view.dispatch(transaction);
              },
            },
          },
        }),
        new Plugin({
          props: this.options.editorProps,
        }),
      ],
    };

    if (this.options.selection) {
      settings.selection = this.options.selection;
    }

    return EditorState.create(settings);
  }

  createDocument(content, parseOptions = this.options.parseOptions) {
    if (content === null) {
      return this.schema.nodeFromJSON(this.options.emptyDocument);
    }

    if (typeof content === 'object') {
      try {
        return this.schema.nodeFromJSON(content);
      } catch (error) {
        console.warn(
          '[tiptap warn]: Invalid content.',
          'Passed value:',
          content,
          'Error:',
          error,
        );
        return this.schema.nodeFromJSON(this.options.emptyDocument);
      }
    }

    if (typeof content === 'string') {
      const element = document.createElement('div');
      element.innerHTML = content.trim();

      return DOMParser.fromSchema(this.schema).parse(element, parseOptions);
    }

    return false;
  }

  createView() {
    return new EditorView(this.element, {
      state: this.createState(),
      handlePaste: (...args) => {
        this.emit('paste', ...args);
      },
      handleDrop: (...args) => {
        this.emit('drop', ...args);
      },
      dispatchTransaction: this.dispatchTransaction.bind(this),
      nodeViews: this.nodeViews,
    });
  }

  dispatchTransaction(transaction) {
    const nodes = findChangedNodesFromTransaction(transaction);
    const newState = this.state.apply(transaction);
    this.view.updateState(newState);
    this.selection = {
      from: this.state.selection.from,
      to: this.state.selection.to,
    };
    this.setActiveNodesAndMarks();

    this.emit('transaction', {
      getHTML: this.getHTML.bind(this),
      getJSON: this.getJSON.bind(this),
      state: this.state,
      transaction,
    });

    if (!transaction.docChanged || transaction.getMeta('preventUpdate')) {
      return;
    }

    this.emitUpdate(transaction);
  }

  emitUpdate(transaction) {
    this.emit('update', {
      getHTML: this.getHTML.bind(this),
      getJSON: this.getJSON.bind(this),
      state: this.state,
      transaction,
    });
  }

  resolveSelection(position = null) {
    if (this.selection && position === null) {
      return this.selection;
    }

    if (position === 'start' || position === true) {
      return {
        from: 0,
        to: 0,
      };
    }

    if (position === 'end') {
      const { doc } = this.state;
      return {
        from: doc.content.size,
        to: doc.content.size,
      };
    }

    return {
      from: position,
      to: position,
    };
  }

  focus(position = null) {
    if (
      process.env.NODE_ENV === 'test' ||
      (this.view.focused && position === null) ||
      position === false
    ) {
      return;
    }

    const { from, to } = this.resolveSelection(position);

    this.setSelection(from, to);

    setTimeout(() => this.view?.focus(), 10); // TODO is this timeout needed
  }

  setSelection(from = 0, to = 0) {
    const { doc, tr } = this.state;
    const resolvedFrom = minMax(from, 0, doc.content.size);
    const resolvedEnd = minMax(to, 0, doc.content.size);
    const selection = TextSelection.create(doc, resolvedFrom, resolvedEnd);
    const transaction = tr.setSelection(selection);

    this.view.dispatch(transaction);
  }

  blur() {
    this.view.dom.blur();
  }

  getSchemaJSON() {
    return JSON.parse(
      JSON.stringify({
        nodes: this.extensions.nodes,
        marks: this.extensions.marks,
      }),
    );
  }

  getHTML() {
    const div = document.createElement('div');
    const fragment = DOMSerializer.fromSchema(this.schema).serializeFragment(
      this.state.doc.content,
    );

    div.appendChild(fragment);

    return div.innerHTML;
  }

  getJSON() {
    return this.state.doc.toJSON();
  }

  setContent(content = {}, emitUpdate = false, parseOptions) {
    const { doc, tr } = this.state;
    const document = this.createDocument(content, parseOptions);
    const selection = TextSelection.create(doc, 0, doc.content.size);
    const transaction = tr
      .setSelection(selection)
      .replaceSelectionWith(document, false)
      .setMeta('preventUpdate', !emitUpdate);

    this.view.dispatch(transaction);
  }

  clearContent(emitUpdate = false) {
    this.setContent(this.options.emptyDocument, emitUpdate);
  }

  setActiveNodesAndMarks() {
    this.activeMarks = Object.fromEntries(
      Object.entries(this.schema.marks).map(([name, mark]) => [
        name,
        (attrs = {}) => isMarkActiveInSelection(mark)(this.state),
      ]),
    );

    this.activeMarkAttrs = Object.fromEntries(
      Object.entries(this.schema.marks).map(([name, mark]) => [
        name,
        getMarkAttrs(this.state, mark),
      ]),
    );

    this.activeNodes = Object.fromEntries(
      Object.entries(this.schema.nodes).map(([name, node]) => [
        name,
        (attrs = {}) => nodeIsActive(this.state, node, attrs),
      ]),
    );
  }

  getMarkAttrs(type = null) {
    return this.activeMarkAttrs[type];
  }

  get isActive() {
    return Object.fromEntries(
      Object.entries({
        ...this.activeMarks,
        ...this.activeNodes,
      }).map(([name, value]) => [name, (attrs = {}) => value(attrs)]),
    );
  }

  registerPlugin(plugin = null) {
    if (!plugin) {
      return;
    }

    const newState = this.state.reconfigure({
      plugins: this.state.plugins.concat([plugin]),
    });
    this.view.updateState(newState);
  }

  unregisterPlugin(name = null) {
    if (!name || !this.view.docView) {
      return;
    }

    const newState = this.state.reconfigure({
      plugins: this.state.plugins.filter(
        (plugin) => !plugin.key.startsWith(`${name}$`),
      ),
    });
    this.view.updateState(newState);
  }

  destroy() {
    if (!this.view) {
      return;
    }
    log('Destroying editor');

    // for some reason this is done to prevent memory leak
    if (this.view.domObserver) {
      this.view.domObserver.disconnectSelection();
    }
    this.view.destroy();
    this.view = undefined;
    super.destroy();
  }

  initNodeViews() {
    if (!this.options.renderNodeView) {
      throw new Error('need render handlers');
    }
    const nodeViews = [...this.builtInExtensions, ...this.options.extensions]
      .filter((extension) => ['node', 'mark'].includes(extension.type))
      .filter((extension) => extension.render)
      .map((extension) => {
        return [
          extension.name,
          (node, view, getPos, decorations) => {
            return new CustomNodeView({
              node,
              view,
              getPos,
              decorations,
              extension,
              renderNodeView: this.options.renderNodeView,
              destroyNodeView: this.options.destroyNodeView,
            });
          },
        ];
      });
    const nodeViewsObj = Object.fromEntries(nodeViews);
    if (Object.keys(nodeViewsObj).length !== nodeViews.length) {
      throw new Error('Multiple nodeviews with the same extension name');
    }

    return nodeViewsObj;
  }
}

// Converts a str `on something` to `onSomething`
function toCamelCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase(),
    )
    .replace(/\s+/g, '');
}

function minMax(value = 0, min = 0, max = 0) {
  return Math.min(Math.max(parseInt(value, 10), min), max);
}
