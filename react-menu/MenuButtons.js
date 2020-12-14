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
import { MenuDropdown, VerticalDropdownGroup } from './MenuDropdown';

export function BoldButton({ ...props }) {
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
    <Icons.BoldIcon
      onMouseDown={onSelect}
      hint={hint}
      isActive={queryIsBoldActive()(view.state)}
      isDisabled={!toggleBold()(view.state)}
      {...props}
    />
  );
}

export function ItalicButton({ ...props }) {
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
    <Icons.ItalicIcon
      onMouseDown={onSelect}
      hint={hint}
      isActive={queryIsItalicActive()(view.state)}
      isDisabled={!toggleItalic()(view.state)}
      {...props}
    />
  );
}

export function CodeButton({ ...props }) {
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
    <Icons.CodeIcon
      onMouseDown={onSelect}
      hint={hint}
      isActive={queryIsCodeActive()(view.state)}
      isDisabled={!toggleCode()(view.state)}
      {...props}
    />
  );
}

export function BulletListButton({ ...props }) {
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
    <Icons.BulletListIcon
      onMouseDown={onSelect}
      hint={hint}
      isActive={queryIsBulletListActive()(view.state)}
      isDisabled={!toggleBulletList()(view.state, undefined, view)}
      {...props}
    />
  );
}

export function TodoListButton({ ...props }) {
  const hint = 'TodoList\n' + todoListKeys.toggle;
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
    <Icons.TodoListIcon
      onMouseDown={onSelect}
      hint={hint}
      isActive={queryIsTodoListActive()(view.state)}
      isDisabled={!toggleTodoList()(view.state, undefined, view)}
      {...props}
    />
  );
}

export function HeadingButton({ level, ...props }) {
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
    <Icons.HeadingIcon
      onMouseDown={onSelect}
      level={level}
      hint={hint}
      isActive={queryIsHeadingActive(level)(view.state)}
      isDisabled={!toggleHeading(level)(view.state)}
      {...props}
    />
  );
}

HeadingButton.propTypes = {
  level: PropTypes.number.isRequired,
};

export function LinkButton({ menuKey }) {
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
    <Icons.LinkIcon
      onMouseDown={onSelect}
      hint={hint}
      isActive={queryIsLinkActive()(view.state)}
      isDisabled={!createLink('')(view.state)}
    />
  );
}
LinkButton.propTypes = {
  menuKey: PropTypes.instanceOf(PluginKey).isRequired,
};

export function DropdownButton({ isDropdownVisible, toggleDropdown }) {
  const hint = 'Heading';
  const onSelect = useCallback(
    (e) => {
      e.preventDefault();
      toggleDropdown((show) => !show);
    },
    [toggleDropdown],
  );
  return (
    <Icons.HeadingIcon
      level="z"
      onMouseDown={onSelect}
      hint={hint}
      isActive={isDropdownVisible}
      isDisabled={false}
    />
  );
}

export function HeadingDropdownButton() {
  return (
    <MenuDropdown
      parent={({ isDropdownVisible, toggleDropdown }) => (
        <DropdownButton
          isDropdownVisible={isDropdownVisible}
          toggleDropdown={toggleDropdown}
        />
      )}
    >
      <div className="bangle-menu-vertical-group">
        <TextButton>Heading 1</TextButton>
        <TextButton>Heading 2</TextButton>
        <TextButton>Heading 3</TextButton>
      </div>
    </MenuDropdown>
  );
}

function TextButton({
  children,
  className = '',
  style = {},
  isActive,
  isDisabled,
  hint,
  hintPos = 'top',
  hintBreakWhiteSpace = true,
  onMouseDown,
  ...props
}) {
  return <span className="bangle-menu-text-button">{children}</span>;
}
