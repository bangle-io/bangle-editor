import Token from 'markdown-it/lib/token';

export function tableMarkdownItPlugin(md: any, options = {}): void {
  md.core.ruler.after('inline', 'tables', function (state: any) {
    state.tokens = removeWrapping(state.tokens, 'tbody');
    state.tokens = removeWrapping(state.tokens, 'thead');
    state.tokens = insertParagraph(state.tokens);
    return false;
  });
}

function removeWrapping(tokens: Token[], type: string) {
  const openType = type + '_open';
  const closeType = type + '_close';
  let subtractBy = 0;

  return tokens.filter((token) => {
    token.level = token.level - subtractBy;

    if (openType === token.type) {
      subtractBy++;
    }

    if (closeType === token.type) {
      subtractBy--;
    }

    return ![openType, closeType].includes(token.type);
  });
}

function insertParagraph(tokens: Token[]) {
  return tokens.flatMap((token) => {
    if (['th_open', 'td_open'].includes(token.type)) {
      if (token.attrs) {
        const [, style] = token.attrs[0];
        (token as any).align = style.split(':')[1];
      }
      return [token, new Token('paragraph_open', 'p', 1)];
    }

    if (['th_close', 'td_close'].includes(token.type)) {
      return [token, new Token('paragraph_close', 'p', -1)];
    }

    return token;
  });
}
