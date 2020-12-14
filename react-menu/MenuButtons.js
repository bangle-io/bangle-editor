import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { rafCommandExec } from '@banglejs/core/utils/js-utils';
import {
  defaultKeys as italicKeys,
  queryIsItalicActive,
  toggleItalic,
} from '@banglejs/core/components/italic';
import {
  defaultKeys as boldKeys,
  queryIsBoldActive,
  toggleBold,
} from '@banglejs/core/components/bold';
import {
  defaultKeys as codeKeys,
  queryIsCodeActive,
  toggleCode,
} from '@banglejs/core/components/code';
import {
  defaultKeys as todoListKeys,
  queryIsTodoListActive,
  toggleTodoList,
} from '@banglejs/core/components/todo-list';
import {
  defaultKeys as paragraphKeys,
  queryIsTopLevelParagraph,
  convertToParagraph,
} from '@banglejs/core/components/paragraph';
import {
  defaultKeys as headingKeys,
  queryIsHeadingActive,
  toggleHeading,
} from '@banglejs/core/components/heading';
import { filter } from '@banglejs/core/utils/pm-utils';
import { createLink, queryIsLinkActive } from '@banglejs/core/components/link';
import {
  defaultKeys as bulletListKeys,
  queryIsBulletListActive,
  toggleBulletList,
} from '@banglejs/core/components/bullet-list';
import * as Icons from './Icons';
import { useEditorViewContext } from '@banglejs/react/hooks';
import { PluginKey } from '@banglejs/core';
import {
  defaultKeys as floatingMenuKeys,
  focusFloatingMenuInput,
  toggleLinkSubMenu,
} from './floating-menu';
import { MenuButton } from './Icon';
import {
  defaultKeys as orderedListKeys,
  queryIsOrderedListActive,
  toggleOrderedList,
} from '@banglejs/core/components/ordered-list';

export function BoldButton({
  longForm = true,
  children = <Icons.BoldIcon />,
  ...props
}) {
  const hint = 'Bold\n' + boldKeys.toggleBold;
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      if (toggleBold()(view.state, view.dispatch, view)) {
        if (view.dispatch) {
          view.focus();
        }
      }
    },
    [view],
  );
  return (
    <MenuButton
      {...props}
      onMouseDown={onSelect}
      hint={hint}
      isActive={queryIsBoldActive()(view.state)}
      isDisabled={!toggleBold()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function ItalicButton({ children = <Icons.ItalicIcon />, ...props }) {
  const hint = 'Italic\n' + italicKeys.toggleItalic;
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      if (toggleItalic()(view.state, view.dispatch, view)) {
        if (view.dispatch) {
          view.focus();
        }
      }
    },
    [view],
  );
  return (
    <MenuButton
      {...props}
      onMouseDown={onSelect}
      hint={hint}
      isActive={queryIsItalicActive()(view.state)}
      isDisabled={!toggleItalic()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function CodeButton({ children = <Icons.CodeIcon />, ...props }) {
  const hint = 'Code\n' + codeKeys.toggleCode;
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      if (toggleCode()(view.state, view.dispatch, view)) {
        if (view.dispatch) {
          view.focus();
        }
      }
    },
    [view],
  );
  return (
    <MenuButton
      {...props}
      onMouseDown={onSelect}
      hint={hint}
      isActive={queryIsCodeActive()(view.state)}
      isDisabled={!toggleCode()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function BulletListButton({
  children = <Icons.BulletListIcon />,
  ...props
}) {
  const hint = 'BulletList\n' + bulletListKeys.toggle;
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      if (toggleBulletList()(view.state, view.dispatch, view)) {
        if (view.dispatch) {
          view.focus();
        }
      }
    },
    [view],
  );
  return (
    <MenuButton
      {...props}
      onMouseDown={onSelect}
      hint={hint}
      isActive={queryIsBulletListActive()(view.state)}
      isDisabled={!toggleBulletList()(view.state, undefined, view)}
    >
      {children}
    </MenuButton>
  );
}

export function OrderedListButton({
  children = <Icons.OrderedListIcon />,
  ...props
}) {
  const hint = 'OrderedList\n' + orderedListKeys.toggle;
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      if (toggleOrderedList()(view.state, view.dispatch, view)) {
        if (view.dispatch) {
          view.focus();
        }
      }
    },
    [view],
  );
  return (
    <MenuButton
      {...props}
      onMouseDown={onSelect}
      hint={hint}
      isActive={queryIsOrderedListActive()(view.state)}
      isDisabled={!toggleOrderedList()(view.state, undefined, view)}
    >
      {children}
    </MenuButton>
  );
}

export function TodoListButton({
  children = <Icons.TodoListIcon />,
  ...props
}) {
  const hint = 'TodoList\n' + todoListKeys.toggle;
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      console.log({ toggleTodoList });
      // TODO fix the undefined dispatch passing
      const allowed = toggleTodoList()(view.state, undefined, view);
      if (allowed) {
        if (view.dispatch) {
          view.focus();
          toggleTodoList()(view.state, view.dispatch, view);
        }
        return true;
      }
      return false;
    },
    [view],
  );
  return (
    <MenuButton
      {...props}
      onMouseDown={onSelect}
      hint={hint}
      isActive={queryIsTodoListActive()(view.state)}
      isDisabled={!toggleTodoList()(view.state, undefined, view)}
    >
      {children}
    </MenuButton>
  );
}

export function HeadingButton({
  level,
  children = <Icons.HeadingIcon level={level} />,
  ...props
}) {
  const hint = `Heading${level}\n` + headingKeys['toH' + level];
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      if (toggleHeading(level)(view.state, view.dispatch, view)) {
        if (view.dispatch) {
          view.focus();
        }
      }
    },
    [view, level],
  );
  return (
    <MenuButton
      {...props}
      onMouseDown={onSelect}
      hint={hint}
      isActive={queryIsHeadingActive(level)(view.state)}
      isDisabled={!toggleHeading(level)(view.state)}
    >
      {children}
    </MenuButton>
  );
}

HeadingButton.propTypes = {
  level: PropTypes.number.isRequired,
};

export function ParagraphButton({
  children = <Icons.ParagraphIcon />,
  ...props
}) {
  const hint = `Paragraph\n` + paragraphKeys.convertToParagraph;
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      if (convertToParagraph()(view.state, view.dispatch, view)) {
        if (view.dispatch) {
          view.focus();
        }
      }
    },
    [view],
  );
  return (
    <MenuButton
      {...props}
      onMouseDown={onSelect}
      hint={hint}
      isActive={queryIsTopLevelParagraph()(view.state)}
      isDisabled={!convertToParagraph()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function LinkButton({ children = <Icons.LinkIcon />, menuKey }) {
  const hint = 'Link\n' + floatingMenuKeys.toggleLink;
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      const command = filter(
        (state) => createLink('')(state),
        (state, dispatch, view) => {
          if (dispatch) {
            toggleLinkSubMenu(menuKey)(view.state, view.dispatch, view);
            rafCommandExec(view, focusFloatingMenuInput(menuKey));
          }
          return true;
        },
      );
      if (command(view.state, view.dispatch, view)) {
        if (view.dispatch) {
          view.focus();
        }
      }
    },
    [view, menuKey],
  );

  return (
    <MenuButton
      onMouseDown={onSelect}
      hint={hint}
      isActive={queryIsLinkActive()(view.state)}
      isDisabled={!createLink('')(view.state)}
    >
      {children}
    </MenuButton>
  );
}
LinkButton.propTypes = {
  menuKey: PropTypes.instanceOf(PluginKey).isRequired,
};
