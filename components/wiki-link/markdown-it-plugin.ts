import { inlineNodeParser } from '@bangle.dev/markdown';

export function wikiLinkMarkdownItPlugin(md: any) {
  inlineNodeParser(md, {
    tokenName: 'wiki_link',
    regex: /\[\[([^\]\[]+)\]\]/g,
    getTokenDetails: (match) => {
      // 2 since [[ has length 2
      return { payload: match.slice(2, -2), markup: match.slice(2, -2) };
    },
  });
}
