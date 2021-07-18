import type Token from 'markdown-it/lib/token';
import type StateCore from 'markdown-it/lib/rules_core/state_core';

export * from './markdown-parser';
export * from './markdown-serializer';
export * from './todo-list-markdown-it-plugin';

export type { Token, StateCore };
export type {
  MarkSerializerConfig,
  TokenConfig,
  MarkSerializerMethod,
  MarkdownSerializerState,
} from 'prosemirror-markdown';
