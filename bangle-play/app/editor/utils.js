import { Editor as PMEditor } from 'bangle-core/editor';
import { schemaLoader } from 'bangle-core/element-loaders';
import { editorSpec } from './spec';

export function getSchema(extensions) {
  return schemaLoader(editorSpec);
  // todo this is temporary way of getting schema we need better than this
  // const dummyEditor = new PMEditor(document.createElement('div'), {
  //   extensions,
  //   renderNodeView: () => {},
  //   destroyNodeView: () => {},
  //   manualViewCreate: true,
  // });
  // const schema = dummyEditor.schema;
  // dummyEditor.destroy();
  // return schema;
}
