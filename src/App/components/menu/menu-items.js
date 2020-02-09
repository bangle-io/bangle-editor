/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';

import { toggleMark, setBlockType } from 'prosemirror-commands';
import { undo, redo } from 'prosemirror-history';
import {
  isMarkActive,
  nodeIsActive
} from 'Utils/bangle-utils/prosemirror-utils';

import { default as DinoComp } from 'Plugins/dinos';

import { menuButtonHOC, dropdownHOC } from './menu-items-hoc';
import { MenuItemLinkButton } from './MenuItemLinkButton';
import { MenuRow } from './MenuRow';

const dinoComp = DinoComp();

export default [
  menuButtonHOC({
    iconType: 'bold',
    label: 'Bold',
    getCommand: ({ schema }) => toggleMark(schema.marks['strong']),
    isActive: ({ schema, editorState }) =>
      isMarkActive(editorState, schema.marks['strong'])
  }),
  menuButtonHOC({
    iconType: 'italic',
    label: 'Italic',
    getCommand: ({ schema }) => toggleMark(schema.marks['em']),
    isActive: ({ schema, editorState }) =>
      isMarkActive(editorState, schema.marks['em'])
  }),
  menuButtonHOC({
    iconType: 'code',
    label: 'Code',
    getCommand: ({ schema }) => toggleMark(schema.marks['code']),
    isActive: ({ schema, editorState }) =>
      isMarkActive(editorState, schema.marks['code'])
  }),
  menuButtonHOC({
    iconType: 'undo',
    label: 'Undo',
    getCommand: () => undo
  }),
  menuButtonHOC({
    iconType: 'redo',
    label: 'Redo',
    getCommand: () => redo
  }),
  MenuItemLinkButton,
  menuButtonHOC({
    iconType: 'heading',
    label: 'Heading',
    getCommand: ({ schema }) =>
      setBlockType(schema.nodes['heading'], {
        level: 3
      }),
    isActive: ({ schema, editorState }) =>
      nodeIsActive(editorState, schema.nodes['heading'], {
        level: 3
      })
  }),
  dropdownHOC({
    label: 'Insert',
    renderItems: ({ onClick, editorState, editorView, schema, dispatch }) => {
      const payload = {
        editorState,
        schema
      };
      return (
        <>
          {dinoComp.menu.rows.map(
            ({ icon, title, subtitle, hint, getCommand, isEnabled }) =>
              isEnabled(payload) && (
                <React.Fragment key={title}>
                  <MenuRow
                    onClick={() => {
                      getCommand(payload)(editorState, dispatch);
                      onClick();
                      editorView.focus();
                    }}
                    icon={icon}
                    title={title}
                    subtitle={subtitle}
                    hint="hint"
                  />
                  <hr
                    className="dropdown-divider"
                    style={{ margin: '2px 0px' }}
                  />
                </React.Fragment>
              )
          )}
        </>
      );
    }
  })
];
