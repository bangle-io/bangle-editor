import React from 'react';
import { EditorState, Transaction, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

export type CommandDispatch = (tr: Transaction) => void;
export type Command = (
  state: EditorState,
  dispatch?: CommandDispatch,
  view?: EditorView
) => boolean;

export type TypeAheadPluginState = {
  isAllowed: boolean;
  active: boolean;
  prevActiveState: boolean;
  query: string | null;
  trigger: string | null;
  typeAheadHandler: TypeAheadHandler | null;
  items: Array<TypeAheadItem>;
  itemsLoader: TypeAheadItemsLoader;
  currentIndex: number;
  queryMarkPos: number | null;
  queryStarted: number;
  upKeyCount: number;
  downKeyCount: number;
  spotlight?: JSX.Element | null;
};

type TypeAheadItemsLoader = null | {
  promise: Promise<Array<TypeAheadItem>>;
  cancel(): void;
};

type TypeAheadInsert = (
  node?: Node | Object | string,
  opts?: { selectInlineNode?: boolean }
) => Transaction;

type TypeAheadItemRenderProps = {
  onClick: () => void;
  onHover: () => void;
  isSelected: boolean;
};

type TypeAheadSelectItem = (
  state: EditorState,
  item: TypeAheadItem,
  insert: TypeAheadInsert,
  meta: {
    mode: SelectItemMode;
  }
) => Transaction | false;

export type SelectItemMode =
  | 'shift-enter'
  | 'enter'
  | 'space'
  | 'selected'
  | 'tab';

export type TypeAheadHandler = {
  trigger: string;
  customRegex?: string;
  getItems?: (
    query: string,
    editorState: EditorState,
    meta: {
      prevActive: boolean;
      queryChanged: boolean;
    },
    tr: Transaction,
    dipatch: Dispatch
  ) => Array<TypeAheadItem> | Promise<Array<TypeAheadItem>>;
  selectItem?: TypeAheadSelectItem;
  dismiss?: (state: EditorState) => void;
  getSpotlight?: (state: EditorState) => JSX.Element | null;
};

type Dispatch<T = any> = (eventName: PluginKey | string, data: T) => void;

export type TypeAheadItem = {
  title: string;
  description?: string;
  keyshortcut?: string;
  icon?: () => React.ReactElement<any>;
  render?: (
    props: TypeAheadItemRenderProps
  ) => React.ReactElement<TypeAheadItemRenderProps> | null;
  [key: string]: any;
};

export type InputRuleHandler = (
  state: EditorState,
  match: Array<string>,
  start: number,
  end: number
) => Transaction | null;
