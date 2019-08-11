import React from 'react';
import { EditorState, Transaction, PluginKey, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

export type CommandDispatch = (tr: Transaction) => void;
export type Command = (
  state: EditorState,
  dispatch?: CommandDispatch,
  view?: EditorView,
) => boolean;
