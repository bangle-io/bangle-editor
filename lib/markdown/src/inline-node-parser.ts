import StateCore from 'markdown-it/lib/rules_core/state_core';
type GetTokenDetails = (match: string) => { payload: string; markup: string };

/**
 * A generic markdown parser for inline nodes which can be
 * programmed to read syntax that can be parsed by a regex.
 * A good use case is something like tags ( `#xyz` ) or wiki-links ( `[xyz]` )
 *
 */
export function inlineNodeParser(
  md: any,
  {
    tokenName,
    regex,
    getTokenDetails = (match: string) => {
      return { payload: match.slice(1, -1), markup: '' };
    },
  }: {
    tokenName: string;
    regex: RegExp;
    getTokenDetails: GetTokenDetails;
  },
) {
  const arrayReplaceAt = md.utils.arrayReplaceAt;

  md.core.ruler.push(tokenName, (state: StateCore) => {
    var i,
      j,
      l,
      tokens,
      token,
      blockTokens = state.tokens,
      autolinkLevel = 0;

    for (j = 0, l = blockTokens.length; j < l; j++) {
      if (blockTokens[j].type !== 'inline') {
        continue;
      }
      tokens = blockTokens[j].children;

      for (i = tokens!.length - 1; i >= 0; i--) {
        token = tokens![i];

        // if (token.type === 'link_open' || token.type === 'link_close') {
        //   if (token.info === 'auto') {
        //     autolinkLevel -= token.nesting;
        //   }
        // }

        if (
          token.type === 'text' &&
          autolinkLevel === 0 &&
          regex.test(token.content)
        ) {
          // replace current node
          blockTokens[j].children = tokens = arrayReplaceAt(
            tokens,
            i,
            splitTextToken(regex, getTokenDetails, tokenName)(
              token.content,
              token.level,
              state.Token,
            ),
          );
        }
      }
    }
  });
}
// inspired from markdown-it-emoji
function splitTextToken(
  regex: RegExp,
  getTokenDetails: GetTokenDetails,
  tokenName: string,
) {
  return (text: string, level: number, Token: any) => {
    var token,
      last_pos = 0,
      nodes = [];

    text.replace(regex, (match: string, ...args: any[]) => {
      // so the callback is called with variable arguments
      // : (match, p1, p2, ...,pN, offset, string);
      // where p1 p2 .. pN, represent the matches due to capturing groups
      // since we donot care about them we extract the second last arg.
      const offset = args[args.length - 2];
      let { payload, markup } = getTokenDetails(match);

      // Add new tokens to pending list
      if (offset > last_pos) {
        token = new Token('text', '', 0);
        token.content = text.slice(last_pos, offset);
        nodes.push(token);
      }

      token = new Token(tokenName, '', 0);
      token.markup = markup;
      token.payload = payload;
      nodes.push(token);

      last_pos = offset + match.length;

      // return empty string to keep type happy
      return '';
    });

    if (last_pos < text.length) {
      token = new Token('text', '', 0);
      token.content = text.slice(last_pos);
      nodes.push(token);
    }

    return nodes;
  };
}
