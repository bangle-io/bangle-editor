import { keymap } from 'prosemirror-keymap';

import { Extension } from '../extensions';
import { Editor } from '../editor';
import * as nodeElements from '../node-components/index';
import * as marks from 'bangle-core/mark-components/index';

function replaceBro(name, nodes, replacement) {
  return nodes.map(([n, node]) => {
    if (n === name) {
      const { name: rName, schema } = replacement.spec();
      if (rName !== name) {
        throw new Error('Not match name ' + rName + ' ' + name);
      }
      return [rName, schema];
    }
    return [n, node];
  });
}

export class ExtensionManager {
  constructor(extensions = [new Extension()], editor = new Editor()) {
    extensions = extensions.filter((r) => r);
    extensions.forEach((extension) => {
      extension.bindEditor(editor);
      extension.init();
    });
    this.extensions = extensions;
  }
  get nodes() {
    let result = this.extensions
      .filter((extension) => extension.type === 'node')
      .map(({ name, schema }) => [name, schema]);

    result = replaceBro('doc', result, nodeElements.doc);
    result = replaceBro('text', result, nodeElements.text);
    result = replaceBro('paragraph', result, nodeElements.paragraph);
    result = replaceBro('hard_break', result, nodeElements.hardBreak);
    return Object.fromEntries(result);
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
              view.updateState(view.state);
            }

            return true;
          },
        }),
      ]),
    );
  }

  get marks() {
    let result = this.extensions
      .filter((extension) => extension.type === 'mark')
      .map(({ name, schema }) => [name, schema]);

    result = replaceBro('bold', result, marks.bold);
    result = replaceBro('code', result, marks.code);
    result = replaceBro('italic', result, marks.italic);
    result = replaceBro('link', result, marks.link);
    result = replaceBro('strike', result, marks.strike);
    result = replaceBro('underline', result, marks.underline);
    return Object.fromEntries(result);
  }

  get plugins() {
    return this.extensions
      .filter((extension) => extension.plugins)
      .flatMap(({ plugins }) => [].concat(plugins).filter(Boolean));
  }

  keymaps({ schema }) {
    const ext = this.extensions.filter((r) => !r.spec);
    const extensionKeymaps = ext
      .filter((extension) => ['extension'].includes(extension.type))
      .filter((extension) => extension.keys)
      .map((extension) => extension.keys({ schema }));
    const nodeMarkKeymaps = ext
      .filter((extension) => ['node', 'mark'].includes(extension.type))
      .filter((extension) => extension.keys)
      .map((extension) => {
        return extension.keys({
          type: schema[`${extension.type}s`][extension.name],
          schema,
        });
      });

    return [...extensionKeymaps, ...nodeMarkKeymaps].map((keys) =>
      keymap(keys),
    );
  }

  inputRules({ schema, excludedExtensions }) {
    if (!Array.isArray(excludedExtensions) && excludedExtensions) {
      return [];
    }

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
    if (!Array.isArray(excludedExtensions) && excludedExtensions) {
      return [];
    }

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
          let value = extension.commands({
            schema,
            type: schema[`${type}s`]?.[name], // type can be node,  mark
          });

          if (typeof value !== 'object') {
            value = {
              [name]: value,
            };
          }
          const apply = (cb, attrs) => {
            if (!view.editable) {
              return false;
            }
            if (!view.hasFocus()) {
              view.focus();
            }
            return cb(attrs)(view.state, view.dispatch, view);
          };

          const handle = ([commandName, commandValue]) => {
            if (Array.isArray(commandValue)) {
              return [
                commandName,
                (attrs) =>
                  commandValue.forEach((callback) => apply(callback, attrs)),
              ];
            } else if (typeof commandValue === 'function') {
              return [commandName, (attrs) => apply(commandValue, attrs)];
            } else {
              throw new Error('unknown command value');
            }
          };

          return Object.entries(value).map(handle);
        }, {}),
    );
  }
}
