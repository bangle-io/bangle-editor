export function wikiLinkMarkdownItPlugin(md) {
  genericNodeParser(md, {
    tokenName: 'wiki_link',
    regex: /\[\[([^\]\[]+)\]\]/g,
    getTokenDetails: (match) => {
      // 2 since [[ has length 2
      return { payload: match.slice(2, -2), markup: match.slice(2, -2) };
    },
  });
}

function genericNodeParser(
  md,
  {
    tokenName,
    regex,
    getTokenDetails = (match) => {
      return { content: match.slice(1, -1), markup: '' };
    },
  },
) {
  const arrayReplaceAt = md.utils.arrayReplaceAt;

  md.core.ruler.push(tokenName, (state) => {
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

      for (i = tokens.length - 1; i >= 0; i--) {
        token = tokens[i];

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
            splitTextToken({ regex, getTokenDetails, tokenName })(
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
function splitTextToken({ regex, getTokenDetails, tokenName }) {
  return (text, level, Token) => {
    var token,
      last_pos = 0,
      nodes = [];
    text.replace(regex, function (match, ...args) {
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
    });

    if (last_pos < text.length) {
      token = new Token('text', '', 0);
      token.content = text.slice(last_pos);
      nodes.push(token);
    }

    return nodes;
  };
}
