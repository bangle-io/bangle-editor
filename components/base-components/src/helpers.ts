// From Prosemirror https://github.com/prosemirror/prosemirror-markdown/blob/6107527995873d6199bc533a753b614378747056/src/to_markdown.ts#L380

import type { NodeType, Schema } from '@bangle.dev/pm';
import { EditorState } from '@bangle.dev/pm';
import { assertNotUndefined } from '@bangle.dev/utils';

// Tries to wrap the string with `"` , if not `''` else `()`
export function quote(str: string) {
  var wrap =
    str.indexOf('"') === -1 ? '""' : str.indexOf("'") === -1 ? "''" : '()';
  return wrap[0] + str + wrap[1];
}

export const getNodeType = (
  arg: Schema | EditorState,
  name: string,
): NodeType => {
  const nodeType =
    arg instanceof EditorState ? arg.schema.nodes[name] : arg.nodes[name];
  assertNotUndefined(nodeType, `nodeType ${name} not found`);
  return nodeType;
};

export const getParaNodeType = (arg: Schema | EditorState): NodeType => {
  const nodeType =
    arg instanceof EditorState
      ? arg.schema.nodes['paragraph']
      : arg.nodes['paragraph'];
  assertNotUndefined(nodeType, `nodeType paragraph not found`);
  return nodeType;
};
