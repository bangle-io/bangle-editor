import { keymap } from 'prosemirror-keymap';

import { Extension } from '../extensions';
import { Editor } from '../editor';

export class ExtensionManager {
  constructor(extensions = [new Extension()], editor = new Editor()) {
    extensions.forEach((extension) => {
      extension.bindEditor(editor);
      extension.init();
    });
    this.extensions = extensions;
  }

  get nodes() {
    return Object.fromEntries(
      this.extensions
        .filter((extension) => extension.type === 'node')
        .map(({ name, schema }) => [name, schema]),
    );
  }

  get options() {
    const { view } = this; // TODO is this bug?, I dont see any view

    return Object.fromEntries(
      this.extensions.map((extension) => [
        extension.name,
        new Proxy(extension.options, {
          set(obj, prop, value) {
            const changed = obj[prop] !== value;

            Object.assign(obj, { [prop]: value });

            if (changed) {
              extension.update(view);
            }

            return true;
          },
        }),
      ]),
    );
  }

  get marks() {
    return Object.fromEntries(
      this.extensions
        .filter((extension) => extension.type === 'mark')
        .map(({ name, schema }) => [name, schema]),
    );
  }

  get plugins() {
    return this.extensions
      .filter((extension) => extension.plugins)
      .flatMap(({ plugins }) => plugins);
  }

  keymaps({ schema }) {
    const extensionKeymaps = this.extensions
      .filter((extension) => ['extension'].includes(extension.type))
      .filter((extension) => extension.keys)
      .map((extension) => extension.keys({ schema }));

    const nodeMarkKeymaps = this.extensions
      .filter((extension) => ['node', 'mark'].includes(extension.type))
      .filter((extension) => extension.keys)
      .map((extension) =>
        extension.keys({
          type: schema[`${extension.type}s`][extension.name],
          schema,
        }),
      );

    return [...extensionKeymaps, ...nodeMarkKeymaps].map((keys) =>
      keymap(keys),
    );
  }

  inputRules({ schema, excludedExtensions }) {
    if (!Array.isArray(excludedExtensions) && excludedExtensions) return [];

    const allowedExtensions = Array.isArray(excludedExtensions)
      ? this.extensions.filter(
          (extension) => !excludedExtensions.includes(extension.name),
        )
      : this.extensions;

    const extensionInputRules = allowedExtensions
      .filter((extension) => ['extension'].includes(extension.type))
      .filter((extension) => extension.inputRules)
      .map((extension) => extension.inputRules({ schema }));

    const nodeMarkInputRules = allowedExtensions
      .filter((extension) => ['node', 'mark'].includes(extension.type))
      .filter((extension) => extension.inputRules)
      .map((extension) =>
        extension.inputRules({
          type: schema[`${extension.type}s`][extension.name],
          schema,
        }),
      );

    return [...extensionInputRules, ...nodeMarkInputRules].flatMap(
      (inputRules) => inputRules,
    );
  }

  pasteRules({ schema, excludedExtensions }) {
    if (!Array.isArray(excludedExtensions) && excludedExtensions) return [];

    const allowedExtensions = Array.isArray(excludedExtensions)
      ? this.extensions.filter(
          (extension) => !excludedExtensions.includes(extension.name),
        )
      : this.extensions;

    const extensionPasteRules = allowedExtensions
      .filter((extension) => ['extension'].includes(extension.type))
      .filter((extension) => extension.pasteRules)
      .map((extension) => extension.pasteRules({ schema }));

    const nodeMarkPasteRules = allowedExtensions
      .filter((extension) => ['node', 'mark'].includes(extension.type))
      .filter((extension) => extension.pasteRules)
      .map((extension) =>
        extension.pasteRules({
          type: schema[`${extension.type}s`][extension.name],
          schema,
        }),
      );

    return [...extensionPasteRules, ...nodeMarkPasteRules].flatMap(
      (pasteRules) => pasteRules,
    );
  }

  commands({ schema, view }) {
    return Object.fromEntries(
      this.extensions
        .filter((extension) => extension.commands)
        .flatMap((extension) => {
          const { name, type } = extension;
          const commands = [];
          const value = extension.commands({
            schema,
            ...(['node', 'mark'].includes(type)
              ? {
                  type: schema[`${type}s`][name],
                }
              : {}),
          });

          const apply = (cb, attrs) => {
            if (!view.editable) {
              return false;
            }
            if (!view.hasFocus()) {
              view.focus();
            }
            return cb(attrs)(view.state, view.dispatch, view);
          };

          const objValue = typeof value === 'object' ? value : { name: value };

          Object.entries(objValue).forEach(([commandName, commandValue]) => {
            if (Array.isArray(commandValue)) {
              commands.push([
                commandName,
                (attrs) =>
                  commandValue.forEach((callback) => apply(callback, attrs)),
              ]);
            } else if (typeof commandValue === 'function') {
              commands.push([
                commandName,
                (attrs) => apply(commandValue, attrs),
              ]);
            }
          });

          return commands;
        }, {}),
    );
  }
}
