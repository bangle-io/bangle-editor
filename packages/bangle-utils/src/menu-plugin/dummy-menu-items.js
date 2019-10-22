import React from 'react';
import { toggleMark } from 'prosemirror-commands';
import { MenuItemPropTypes } from './menu-item-proptypes';
import { isMarkActive } from '../prosemirror-utils';

function iconMenuItemsHOC({
  iconType,
  getCommand,
  isActive,
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
        className="menu-item-icon"
        style={{
          background: active ? '#aaa' : 'unset',
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
    getCommand: ({ schema }) => toggleMark(schema.marks['strong']),
    isActive: ({ schema, editorState }) =>
      isMarkActive(editorState, schema.marks['strong']),
  }),
  iconMenuItemsHOC({
    iconType: 'em',
    getCommand: ({ schema }) => toggleMark(schema.marks['em']),
    isActive: ({ schema, editorState }) =>
      isMarkActive(editorState, schema.marks['em']),
  }),
  iconMenuItemsHOC({
    iconType: 'code',
    getCommand: ({ schema }) => toggleMark(schema.marks['code']),
    isActive: ({ schema, editorState }) =>
      isMarkActive(editorState, schema.marks['code']),
  }),
];
