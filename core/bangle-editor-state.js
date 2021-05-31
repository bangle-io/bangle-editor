import { EditorState } from 'prosemirror-state';
import { Node, DOMParser } from 'prosemirror-model';

import { SpecRegistry } from './spec-registry';
import { pluginLoader } from './utils/plugin-loader';

export class BangleEditorState {
  constructor({
    specRegistry,
    specs,
    plugins = () => [],
    initialValue,
    editorProps,
    pmStateOpts,
    pluginMetadata = {},
  } = {}) {
    if (specs && specRegistry) {
      throw new Error('Cannot have both specs and specRegistry defined');
    }

    if (!specRegistry) {
      specRegistry = new SpecRegistry(specs);
    }

    if (Array.isArray(plugins)) {
      console.warn(
        'The use plugins as an array is deprecated, please pass a function which returns an array of plugins. Refer: https://bangle.dev/docs/api/core#bangleeditorstate',
      );
    }
    this.specRegistry = specRegistry;
    const schema = this.specRegistry.schema;

    this.pmState = EditorState.create({
      schema,
      doc: createDocument({ schema, content: initialValue }),
      plugins: pluginLoader(specRegistry, plugins, {
        editorProps,
        metadata: pluginMetadata,
      }),
      ...pmStateOpts,
    });
  }
}

const createDocument = ({ schema, content, parseOptions }) => {
  const emptyDocument = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
      },
    ],
  };

  if (content == null) {
    return schema.nodeFromJSON(emptyDocument);
  }

  if (content instanceof Node) {
    return content;
  }
  if (typeof content === 'object') {
    return schema.nodeFromJSON(content);
  }

  if (typeof content === 'string') {
    const element = document.createElement('div');
    element.innerHTML = content.trim();
    return DOMParser.fromSchema(schema).parse(element, parseOptions);
  }

  return false;
};
