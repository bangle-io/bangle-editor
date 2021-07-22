import {
  DOMParser,
  EditorProps,
  EditorState,
  Mark,
  Node,
  ParseOptions,
  Schema,
  Selection,
} from '@bangle.dev/pm';
import { RawSpecs, SpecRegistry } from './spec-registry';
import { pluginLoader, RawPlugins } from './utils/plugin-loader';

type InitialContent = string | Node | object;

export interface BangleEditorStateProps<PluginMetadata = any> {
  specRegistry?: SpecRegistry;
  specs?: RawSpecs;
  plugins?: RawPlugins;
  initialValue?: InitialContent;
  editorProps?: EditorProps;
  pmStateOpts?: {
    selection?: Selection | null | undefined;
    storedMarks?: Mark[] | null | undefined;
  };
  pluginMetadata?: PluginMetadata;
}

export class BangleEditorState<PluginMetadata> {
  specRegistry: SpecRegistry;
  pmState: EditorState;

  constructor({
    specRegistry,
    specs,
    plugins = () => [],
    initialValue,
    editorProps,
    pmStateOpts,
    pluginMetadata,
  }: BangleEditorStateProps<PluginMetadata> = {}) {
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

    const pmPlugins = pluginLoader(specRegistry, plugins, {
      editorProps,
      metadata: pluginMetadata,
    });

    this.pmState = EditorState.create({
      schema,
      doc: createDocument({ schema, content: initialValue }),
      plugins: pmPlugins,
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
