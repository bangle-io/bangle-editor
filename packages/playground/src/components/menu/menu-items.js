/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';

import { toggleMark } from 'prosemirror-commands';
import { undo, redo } from 'prosemirror-history';
import { isMarkActive } from 'bangle-utils/src/prosemirror-utils';

import { menuButtonHOC, dropdownHOC } from './menu-items-hoc';
import { MenuItemLinkButton } from './MenuItemLinkButton';

// TODO I need to validate if schema type exists? should I?
export default [
  menuButtonHOC({
    iconType: 'bold',
    label: 'Bold',
    getCommand: ({ schema }) => toggleMark(schema.marks['strong']),
    isActive: ({ schema, editorState }) =>
      isMarkActive(editorState, schema.marks['strong']),
  }),
  menuButtonHOC({
    iconType: 'italic',
    label: 'Italic',
    getCommand: ({ schema }) => toggleMark(schema.marks['em']),
    isActive: ({ schema, editorState }) =>
      isMarkActive(editorState, schema.marks['em']),
  }),
  menuButtonHOC({
    iconType: 'code',
    label: 'Code',
    getCommand: ({ schema }) => toggleMark(schema.marks['code']),
    isActive: ({ schema, editorState }) =>
      isMarkActive(editorState, schema.marks['code']),
  }),
  menuButtonHOC({
    iconType: 'undo',
    label: 'Undo',
    getCommand: () => undo,
  }),
  menuButtonHOC({
    iconType: 'redo',
    label: 'Redo',
    getCommand: () => redo,
  }),
  MenuItemLinkButton,
  dropdownHOC({
    label: 'Insert',
    renderItems: (props) => {
      const Bold = menuButtonHOC({
        iconType: 'bold',
        label: 'Bold',
        getCommand: ({ schema }) => toggleMark(schema.marks['strong']),
        isActive: ({ schema, editorState }) =>
          isMarkActive(editorState, schema.marks['strong']),
      });
      return (
        <>
          <div href="#" className="dropdown-item">
            <Bold {...props} /> Link
          </div>
          <a className="dropdown-item">Other dropdown item</a>
          <a href="#" className="dropdown-item is-active">
            Active dropdown item
          </a>
          <a href="#" className="dropdown-item">
            Other dropdown item
          </a>
          <hr className="dropdown-divider" />
          <a href="#" className="dropdown-item">
            With a divider
          </a>
        </>
      );
    },
  }),
];
