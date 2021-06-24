import { EditorState } from 'prosemirror-state';
import { Node, DOMParser, Mark, Schema, ParseOptions } from 'prosemirror-model';

import { SpecRegistry, RawSpecs } from './spec-registry';
import { RawPlugins, pluginLoader } from './utils/plugin-loader';
import { EditorProps } from 'prosemirror-view';

type InitialContent = string | Node | object;

export interface BangleEditorStateProps {
  specRegistry?: SpecRegistry;
  specs?: RawSpecs;
  plugins?: RawPlugins;
  initialValue?: InitialContent;
  editorProps?: EditorProps;
  pmStateOpts?: {
    storedMarks?: Mark[] | null;
    plugins?: Plugin[] | null;
  };
  pluginMetadata?: any;
}

export class BangleEditorState {
  specRegistry: SpecRegistry;
  pmState: EditorState;

  constructor({
    specRegistry,
    specs,
    plugins = () => [],
    initialValue,
    editorProps,
    pmStateOpts,
    pluginMetadata = {},
  }: BangleEditorStateProps = {}) {
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

const createDocument = ({
  schema,
  content,
  parseOptions,
}: {
  schema: Schema;
  content?: InitialContent;
  parseOptions?: ParseOptions;
}): Node | null => {
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

  return null;
};
