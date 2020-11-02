import { schemaLoader } from 'bangle-core/element-loaders';
import { editorSpec } from './editor-spec';

export function getSchema() {
  return schemaLoader(editorSpec);
}
