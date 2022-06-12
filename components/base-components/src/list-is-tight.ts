import type Token from 'markdown-it/lib/token';

// markdown parsing helper
export function listIsTight(tokens: Token[], i: number) {
  while (++i < tokens.length) {
    let token = tokens[i];
    if (token && token.type !== 'list_item_open') {
      return token.hidden;
    }
  }
  return false;
}
