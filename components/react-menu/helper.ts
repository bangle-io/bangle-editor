import { EditorState } from '@bangle.dev/pm';

export function hasComponentInSchema(state: EditorState, name: string) {
  return Boolean(state.schema.nodes[name]) || Boolean(state.schema.marks[name]);
}
