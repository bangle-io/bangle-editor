/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';

import { toggleMark, setBlockType } from 'prosemirror-commands';
import { undo, redo } from 'prosemirror-history';
import { isMarkActive, nodeIsActive } from 'bangle-utils/src/prosemirror-utils';

import { menuButtonHOC, dropdownHOC } from './menu-items-hoc';
import { MenuItemLinkButton } from './MenuItemLinkButton';
import { MenuRow } from './MenuRow';

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
  menuButtonHOC({
    iconType: 'heading',
    label: 'Heading',
    getCommand: ({ schema }) =>
      setBlockType(schema.nodes['heading'], {
        level: 3,
      }),
    isActive: ({ schema, editorState }) =>
      nodeIsActive(editorState, schema.nodes['heading'], {
        level: 3,
      }),
  }),

  dropdownHOC({
    label: 'Insert',
    renderItems: ({ onClick, editorState, schema, dispatch }) => {
      return (
        <>
          <MenuRow
            onClick={onClick}
            rightText={'rightText'}
            iconType={'link'}
            iconLabel={'link'}
            title="My favorite"
            subtitle="Doing this makes the life easiest. I went to gym bithc"
          />
          <hr className="dropdown-divider" style={{ margin: '2px 0px' }} />
          <MenuRow
            onClick={onClick}
            rightText="Right Text"
            iconType={'star'}
            iconLabel={'link'}
            title="My Ass"
            subtitle="Doing this makes the life easiest. I went to gym bithc"
          />
          <hr className="dropdown-divider" style={{ margin: '2px 0px' }} />
          <MenuRow
            onClick={onClick}
            rightText="Right Text"
            iconType={'star'}
            iconLabel={'link'}
            title="My Ass"
            subtitle="Doing this makes the life easiest. I went to gym bithc"
          />
          <hr className="dropdown-divider" style={{ margin: '2px 0px' }} />
          <MenuRow
            onClick={onClick}
            rightText="Right Text"
            iconType={'star'}
            iconLabel={'link'}
            title="My Ass"
            subtitle="Doing this makes the life easiest. I went to gym bithc"
          />
          <hr className="dropdown-divider" style={{ margin: '2px 0px' }} />
          <MenuRow
            onClick={onClick}
            rightText="Right Text"
            iconType={'star'}
            iconLabel={'link'}
            title="My Ass"
            subtitle="Doing this makes the life easiest. I went to gym bithc"
          />
          <hr className="dropdown-divider" style={{ margin: '2px 0px' }} />
          <MenuRow
            onClick={onClick}
            rightText="Right Text"
            iconType={'star'}
            iconLabel={'link'}
            title="My Ass"
            subtitle="Doing this makes the life easiest. I went to gym bithc"
          />
          <hr className="dropdown-divider" style={{ margin: '2px 0px' }} />
          <MenuRow
            onClick={onClick}
            rightText="Right Text"
            iconType={'star'}
            iconLabel={'link'}
            title="My Ass"
            subtitle="Doing this makes the life easiest. I went to gym bithc"
          />
        </>
      );
    },
  }),
];
