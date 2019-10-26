import { toggleMark } from 'prosemirror-commands';
import { undo, redo } from 'prosemirror-history';
import { isMarkActive } from 'bangle-utils/src/prosemirror-utils';
import { menuItemsHOC } from './menu-items-hoc';

export default [
  menuItemsHOC({
    iconType: 'bold',
    label: 'Bold',
    getCommand: ({ schema }) => toggleMark(schema.marks['strong']),
    isActive: ({ schema, editorState }) =>
      isMarkActive(editorState, schema.marks['strong']),
  }),
  menuItemsHOC({
    iconType: 'italic',
    label: 'Italic',
    getCommand: ({ schema }) => toggleMark(schema.marks['em']),
    isActive: ({ schema, editorState }) =>
      isMarkActive(editorState, schema.marks['em']),
  }),
  menuItemsHOC({
    iconType: 'code',
    label: 'Code',
    getCommand: ({ schema }) => toggleMark(schema.marks['code']),
    isActive: ({ schema, editorState }) =>
      isMarkActive(editorState, schema.marks['code']),
  }),
  menuItemsHOC({
    iconType: 'undo',
    label: 'Undo',
    getCommand: () => undo,
  }),
  menuItemsHOC({
    iconType: 'redo',
    label: 'Redo',
    getCommand: () => redo,
  }),
  menuItemsHOC({
    iconType: 'link',
    label: 'Link',
    getCommand: () => redo,
    isEnabled: ({ editorState }) => !editorState.selection.empty,
  }),
];
