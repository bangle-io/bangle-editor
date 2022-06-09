import type { MarkdownParser } from 'prosemirror-markdown';

export type ParseSpec = ConstructorParameters<typeof MarkdownParser>[2][''];
