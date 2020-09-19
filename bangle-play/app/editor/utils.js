import { Editor as PMEditor } from 'bangle-core/editor';

export function getSchema(extensions) {
  // todo this is temporary way of getting schema we need better than this
  const dummyEditor = new PMEditor(document.createElement('div'), {
    extensions,
    renderNodeView: () => {},
    destroyNodeView: () => {},
    manualViewCreate: true,
  });
  const schema = dummyEditor.schema;
  dummyEditor.destroy();
  return schema;
}
