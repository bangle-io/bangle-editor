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

export function BoldButton({ ...props }) {
  const hint = 'Bold\n' + boldKeys.toggleBold;
  const view = useEditorViewContext();
  const onSelect = useCallback(() => {
    if (toggleBold()(view.state, view.dispatch, view)) {
      if (view.dispatch) {
        view.focus();
      }
    }
  }, [view]);
  return (
    <Icons.BoldIcon
      hint={hint}
      onSelect={onSelect}
      isActive={queryIsBoldActive()(view.state)}
      isDisabled={!toggleBold()(view.state)}
      {...props}
    />
  );
}

export function ItalicButton({ ...props }) {
  const hint = 'Italic\n' + italicKeys.toggleItalic;
  const view = useEditorViewContext();
  const onSelect = useCallback(() => {
    if (toggleItalic()(view.state, view.dispatch, view)) {
      if (view.dispatch) {
        view.focus();
      }
    }
  }, [view]);
  return (
    <Icons.ItalicIcon
      hint={hint}
      onSelect={onSelect}
      isActive={queryIsItalicActive()(view.state)}
      isDisabled={!toggleItalic()(view.state)}
      {...props}
    />
  );
}

export function CodeButton({ ...props }) {
  const hint = 'Code\n' + codeKeys.toggleCode;
  const view = useEditorViewContext();
  const onSelect = useCallback(() => {
    if (toggleCode()(view.state, view.dispatch, view)) {
      if (view.dispatch) {
        view.focus();
      }
    }
  }, [view]);
  return (
    <Icons.CodeIcon
      hint={hint}
      onSelect={onSelect}
      isActive={queryIsCodeActive()(view.state)}
      isDisabled={!toggleCode()(view.state)}
      {...props}
    />
  );
}

export function BulletListButton({ ...props }) {
  const hint = 'BulletList\n' + bulletListKeys.toggle;
  const view = useEditorViewContext();
  const onSelect = useCallback(() => {
    if (toggleBulletList()(view.state, view.dispatch, view)) {
      if (view.dispatch) {
        view.focus();
      }
    }
  }, [view]);
  return (
    <Icons.BulletListIcon
      hint={hint}
      onSelect={onSelect}
      isActive={queryIsBulletListActive()(view.state)}
      isDisabled={!toggleBulletList()(view.state)}
      {...props}
    />
  );
}

export function TodoListButton({ ...props }) {
  const hint = 'TodoList\n' + todoListKeys.toggle;
  const view = useEditorViewContext();
  const onSelect = useCallback(() => {
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
  }, [view]);
  return (
    <Icons.TodoListIcon
      hint={hint}
      onSelect={onSelect}
      isActive={queryIsTodoListActive()(view.state)}
      isDisabled={!toggleTodoList()(view.state, undefined, view)}
      {...props}
    />
  );
}

export function HeadingButton({ level, ...props }) {
  const hint = `Heading${level}\n` + headingKeys['toH' + level];
  const view = useEditorViewContext();
  const onSelect = useCallback(() => {
    if (toggleHeading(level)(view.state, view.dispatch, view)) {
      if (view.dispatch) {
        view.focus();
      }
    }
  }, [view, level]);
  return (
    <Icons.HeadingIcon
      level={level}
      hint={hint}
      onSelect={onSelect}
      isActive={queryIsHeadingActive(level)(view.state)}
      isDisabled={!toggleHeading(level)(view.state)}
      {...props}
    />
  );
}

export function LinkButton({ menuKey }) {
  const hint = 'Link\n' + floatingMenuKeys.toggleLink;
  const view = useEditorViewContext();
  const onSelect = useCallback(() => {
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
  }, [view, menuKey]);

  return (
    <Icons.LinkIcon
      hint={hint}
      onSelect={onSelect}
      isActive={queryIsLinkActive()(view.state)}
      isDisabled={!createLink('')(view.state)}
    />
  );
}
LinkButton.propTypes = {
  menuKey: PropTypes.instanceOf(PluginKey).isRequired,
};
