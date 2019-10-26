import React from 'react';
import { toggleMark } from 'prosemirror-commands';
import { undo, redo } from 'prosemirror-history';
import { MenuItemPropTypes } from './menu-item-proptypes';
import { isMarkActive } from '../prosemirror-utils';
import './menu-icons.css';

function iconMenuItemsHOC({
  iconType,
  getCommand,
  isActive = () => false,
  // default to dry running the command : dry run == run without dispatch
  isEnabled = (payload) => getCommand(payload)(payload.editorState),
}) {
  function IconMenuItem({ editorState, schema, dispatch }) {
    const payload = {
      editorState,
      schema,
    };
    const cmd = getCommand(payload);
    const active = isActive(payload);
    const enabled = isEnabled(payload);
    return (
      <span
        onClick={(e) => {
          enabled && cmd(editorState, dispatch);
        }}
        className={`menu-item-icon ${enabled ? '' : 'disabled'}`}
        style={{
          background: enabled && active ? '#aaa' : 'unset',
          borderRadius: 4,
        }}
      >
        <span className={`icon-${iconType}`} />
      </span>
    );
  }
  IconMenuItem.propTypes = MenuItemPropTypes;
  return IconMenuItem;
}

export default [
  iconMenuItemsHOC({
    iconType: 'strong',
    label: 'Bold',
    getCommand: ({ schema }) => toggleMark(schema.marks['strong']),
    isActive: ({ schema, editorState }) =>
      isMarkActive(editorState, schema.marks['strong']),
  }),
  iconMenuItemsHOC({
    iconType: 'em',
    label: 'Italics',
    getCommand: ({ schema }) => toggleMark(schema.marks['em']),
    isActive: ({ schema, editorState }) =>
      isMarkActive(editorState, schema.marks['em']),
  }),
  iconMenuItemsHOC({
    iconType: 'code',
    label: 'Code',
    getCommand: ({ schema }) => toggleMark(schema.marks['code']),
    isActive: ({ schema, editorState }) =>
      isMarkActive(editorState, schema.marks['code']),
  }),
  iconMenuItemsHOC({
    iconType: 'undo',
    label: 'Undo',
    getCommand: () => undo,
  }),
  iconMenuItemsHOC({
    iconType: 'redo',
    label: 'Redo',
    getCommand: () => redo,
  }),
];
