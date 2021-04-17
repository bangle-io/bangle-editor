// markdown parsing helper
export function listIsTight(tokens, i) {
  while (++i < tokens.length) {
    if (tokens[i].type !== 'list_item_open') {
      return tokens[i].hidden;
    }
  }
  return false;
}
