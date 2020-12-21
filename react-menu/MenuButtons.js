import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { rafCommandExec } from '@bangle.dev/core/utils/js-utils';
import {
  defaultKeys as italicKeys,
  queryIsItalicActive,
  toggleItalic,
} from '@bangle.dev/core/components/italic';
import {
  defaultKeys as boldKeys,
  queryIsBoldActive,
  toggleBold,
} from '@bangle.dev/core/components/bold';
import {
  defaultKeys as codeKeys,
  queryIsCodeActive,
  toggleCode,
} from '@bangle.dev/core/components/code';
import * as blockquote from '@bangle.dev/core/components/blockquote';
import {
  defaultKeys as todoListKeys,
  queryIsTodoListActive,
  toggleTodoList,
} from '@bangle.dev/core/components/todo-list';
import {
  defaultKeys as paragraphKeys,
  queryIsTopLevelParagraph,
  convertToParagraph,
} from '@bangle.dev/core/components/paragraph';
import {
  defaultKeys as headingKeys,
  queryIsHeadingActive,
  toggleHeading,
} from '@bangle.dev/core/components/heading';
import { filter } from '@bangle.dev/core/utils/pm-utils';
import {
  createLink,
  queryIsLinkActive,
} from '@bangle.dev/core/components/link';
import {
  defaultKeys as bulletListKeys,
  queryIsBulletListActive,
  toggleBulletList,
} from '@bangle.dev/core/components/bullet-list';
import * as Icons from './Icons';
import { useEditorViewContext } from '@bangle.dev/react';
import { PluginKey } from '@bangle.dev/core';
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
} from '@bangle.dev/core/components/ordered-list';

export function BoldButton({
  hint = 'Bold\n' + boldKeys.toggleBold,
  hintPos = 'top',
  children = <Icons.BoldIcon />,
  ...props
}) {
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
      hintPos={hintPos}
      onMouseDown={onSelect}
      hint={hint}
      isActive={queryIsBoldActive()(view.state)}
      isDisabled={!toggleBold()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function BlockquoteButton({
  hint = 'Wrap in Blockquote\n' + blockquote.defaultKeys.wrapIn,
  hintPos = 'top',
  children = <Icons.BlockquoteIcon />,
  ...props
}) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      if (
        blockquote.commands.wrapInBlockquote()(view.state, view.dispatch, view)
      ) {
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
      hintPos={hintPos}
      onMouseDown={onSelect}
      hint={hint}
      isActive={blockquote.commands.queryIsBlockquoteActive()(view.state)}
      isDisabled={!blockquote.commands.wrapInBlockquote()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function ItalicButton({
  hint = 'Italic\n' + italicKeys.toggleItalic,
  hintPos = 'top',
  children = <Icons.ItalicIcon />,
  ...props
}) {
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
      hintPos={hintPos}
      onMouseDown={onSelect}
      hint={hint}
      isActive={queryIsItalicActive()(view.state)}
      isDisabled={!toggleItalic()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function CodeButton({
  hint = 'Code\n' + codeKeys.toggleCode,
  hintPos = 'top',
  children = <Icons.CodeIcon />,
  ...props
}) {
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
      hintPos={hintPos}
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
  hint = 'BulletList\n' + bulletListKeys.toggle,
  hintPos = 'top',
  children = <Icons.BulletListIcon />,
  ...props
}) {
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
      hintPos={hintPos}
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
  hint = 'OrderedList\n' + orderedListKeys.toggle,
  hintPos = 'top',
  children = <Icons.OrderedListIcon />,
  ...props
}) {
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
      hintPos={hintPos}
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
  hint = 'TodoList\n' + todoListKeys.toggle,
  hintPos = 'top',
  children = <Icons.TodoListIcon />,
  ...props
}) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
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
      hintPos={hintPos}
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
  hint = `Heading${level}\n` + headingKeys['toH' + level],
  hintPos = 'top',
  children = <Icons.HeadingIcon level={level} />,
  ...props
}) {
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
      hintPos={hintPos}
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
  hint = `Paragraph\n` + paragraphKeys.convertToParagraph,
  hintPos = 'top',
  children = <Icons.ParagraphIcon />,
  ...props
}) {
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
      hintPos={hintPos}
      onMouseDown={onSelect}
      hint={hint}
      isActive={queryIsTopLevelParagraph()(view.state)}
      isDisabled={!convertToParagraph()(view.state)}
    >
      {children}
    </MenuButton>
  );
}

export function FloatingLinkButton({
  hint = 'Link\n' + floatingMenuKeys.toggleLink,
  hintPos = 'top',
  children = <Icons.LinkIcon />,
  menuKey,
}) {
  const view = useEditorViewContext();

  const onMouseDown = useCallback(
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
      onMouseDown={onMouseDown}
      hint={hint}
      hintPos={hintPos}
      isActive={queryIsLinkActive()(view.state)}
      isDisabled={!createLink('')(view.state)}
    >
      {children}
    </MenuButton>
  );
}
FloatingLinkButton.propTypes = {
  menuKey: PropTypes.instanceOf(PluginKey).isRequired,
};
