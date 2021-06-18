import Token from 'markdown-it/lib/token';

// markdown parsing helper
export function listIsTight(tokens: Token[], i: number) {
  while (++i < tokens.length) {
    if (tokens[i].type !== 'list_item_open') {
      return tokens[i].hidden;
    }
  }
  return false;
}
