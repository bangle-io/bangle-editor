import { Schema } from 'prosemirror-model';
import { nodeHelpers } from 'bangle-utils';

import {
  DINO_NODE_NAME,
  dinoAttrTypes,
  dinoAttrDefaults,
  DINO_WRAPPER_ELEMENT
} from './constants';

export const dinoNodeSpec = {
  attrs: nodeHelpers.attributesForNodeSpec(dinoAttrTypes, dinoAttrDefaults),
  inline: true,
  group: 'inline',
  draggable: true,
  // NOTE: Seems like this is used as an output to outside world
  //      when you like copy or drag
  toDOM: node => {
    return [
      DINO_WRAPPER_ELEMENT,
      nodeHelpers.attributesForToDom(dinoAttrTypes)(node)
    ];
  },
  // NOTE: this is the opposite part where you parse the output of toDOM
  //      When getAttrs returns false, the rule won't match
  //      Also, it only takes attributes defined in spec.attrs
  parseDOM: [
    {
      tag: DINO_WRAPPER_ELEMENT,
      getAttrs: nodeHelpers.attributesForParseDom(dinoAttrTypes)
    }
  ]
};

export function insertSchema(schema) {
  const dinoSchema = new Schema({
    ...schema.spec,
    nodes: schema.spec.nodes.addBefore('image', DINO_NODE_NAME, dinoNodeSpec)
  });
  return dinoSchema;
}
