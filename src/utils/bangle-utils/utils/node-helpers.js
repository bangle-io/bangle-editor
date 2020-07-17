import { validate } from './validate';

export function getAttrsFromNode(attrTypes, node) {
  return Object.fromEntries(
    Object.keys(attrTypes).map((attr) => [attr, node.attrs[attr]]),
  );
}

// Gets the attributes for node spec https://prosemirror.net/docs/ref/#model.NodeSpec.attrs
export function attributesForNodeSpec(attrTypes, attrDefaults) {
  if (!validate(attrTypes, attrDefaults)) {
    throw new Error('no match');
  }
  const obj = {};
  for (const attr of Object.keys(attrTypes)) {
    obj[attr] = {
      default: attrDefaults[attr],
    };
  }
  return obj;
}

// Gets a nice attribute object {<attr_name>: value} for toDom method
export function attributesForToDom(attrTypes) {
  return (node) => {
    return getAttrsFromNode(attrTypes, node);
  };
}

export function attributesForParseDom(attrTypes) {
  const attrs = Object.keys(attrTypes);
  return (dom) => {
    const parsed = Object.fromEntries(
      attrs.map((attr) => [attr, dom.getAttribute(attr)]),
    );
    // When  returns false, the rule won't match
    // Also, it only takes attributes defined in spec.attrs
    if (!validate(attrTypes, parsed)) {
      return false;
    }
    return parsed;
  };
}
