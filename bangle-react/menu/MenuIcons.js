import React from 'react';
import {
  queryIsSelectionInItalic,
  toggleItalic,
} from 'bangle-core/components/italic';
import { Icon } from './Icon';
import {
  queryIsSelectionInBold,
  toggleBold,
} from 'bangle-core/components/bold';
import {
  queryIsSelectionInCode,
  toggleCode,
} from 'bangle-core/components/code';
import {
  isSelectionInsideTodoList,
  toggleTodoList,
} from 'bangle-core/components/todo-list';
import {
  queryIsSelectionInHeading,
  toggleHeading,
} from 'bangle-core/components/heading';
import { filter } from 'bangle-core/utils/pm-utils';
import {
  queryIsSelectionInLink,
  updateLinkAtSelection,
} from 'bangle-core/components/link';
import {
  isSelectionInsideBulletList,
  toggleBulletList,
} from 'bangle-core/components/bullet-list';

export const boldItem = () => ({
  type: 'command',
  name: 'Bold',
  command: (state, dispatch, view) => {
    if (toggleBold()(state, dispatch, view)) {
      if (dispatch) {
        view.focus();
      }
      return true;
    }
    return false;
  },
  component: BoldIcon,
  isActive: queryIsSelectionInBold(),
});

export const italicItem = () => ({
  type: 'command',
  name: 'Italic',
  command: (state, dispatch, view) => {
    if (toggleItalic()(state, dispatch, view)) {
      if (dispatch) {
        view.focus();
      }
      return true;
    }
    return false;
  },
  component: ItalicIcon,
  isActive: queryIsSelectionInItalic(),
});

export const codeItem = () => ({
  type: 'command',
  name: 'Code',
  command: (state, dispatch, view) => {
    if (toggleCode()(state, dispatch, view)) {
      if (dispatch) {
        view.focus();
      }
      return true;
    }
    return false;
  },
  component: CodeIcon,
  isActive: queryIsSelectionInCode(),
});

export const bulletListItem = () => ({
  type: 'command',
  name: 'BulletList',
  command: (state, dispatch, view) => {
    if (toggleBulletList(state, dispatch, view)) {
      if (dispatch) {
        view.focus();
      }
      return true;
    }
    return false;
  },
  component: BulletListIcon,
  isActive: isSelectionInsideBulletList,
});

export const todoListItem = () => ({
  type: 'command',
  name: 'TodoList',
  command: (state, dispatch, view) => {
    const allowed = toggleTodoList(state, undefined, view);
    if (allowed) {
      if (dispatch) {
        view.focus();
      }
      toggleTodoList(state, dispatch, view);
      return true;
    }
    return false;
  },
  component: TodoListIcon,
  isActive: isSelectionInsideTodoList,
});

export const heading2Item = () => ({
  type: 'command',
  name: 'Heading2',
  command: (state, dispatch, view) => {
    const allowed = true;
    if (allowed) {
      if (dispatch) {
        view.focus();
      }
      return toggleHeading(2)(state, dispatch, view);
    }
    return false;
  },
  component: Heading2Icon,
  isActive: queryIsSelectionInHeading(2),
});

export const heading3Item = () => ({
  type: 'command',
  name: 'Heading3',
  command: (state, dispatch, view) => {
    const allowed = true;
    if (allowed) {
      if (dispatch) {
        view.focus();
      }
      return toggleHeading(3)(state, dispatch, view);
    }
    return false;
  },
  component: Heading3Icon,
  isActive: queryIsSelectionInHeading(3),
});

export const linkItem = (showLinkMenu) => ({
  type: 'command',
  name: 'Link',
  command: filter(
    (state) => updateLinkAtSelection('')(state),
    (state, dispatch, view) => {
      if (dispatch) {
        showLinkMenu();
      }
      return true;
    },
  ),
  component: LinkIcon,
  isActive: queryIsSelectionInLink(),
});

function BoldIcon(props) {
  return (
    <Icon viewBox={'-6 -5 24 24'} {...props}>
      <path d="M5.997 14H1.72c-.618 0-1.058-.138-1.323-.415C.132 13.308 0 12.867 0 12.262V1.738C0 1.121.135.676.406.406.676.136 1.114 0 1.719 0h4.536c.669 0 1.248.041 1.738.124.49.083.93.242 1.318.478a3.458 3.458 0 0 1 1.461 1.752c.134.366.2.753.2 1.16 0 1.401-.7 2.426-2.1 3.075 1.84.586 2.76 1.726 2.76 3.42 0 .782-.2 1.487-.602 2.114a3.61 3.61 0 0 1-1.623 1.39 5.772 5.772 0 0 1-1.471.377c-.554.073-1.2.11-1.939.11zm-.21-6.217h-2.95v4.087h3.046c1.916 0 2.874-.69 2.874-2.072 0-.707-.248-1.22-.745-1.537-.496-.319-1.238-.478-2.225-.478zM2.837 2.13v3.619h2.597c.707 0 1.252-.067 1.638-.2.385-.134.68-.389.883-.765.16-.267.239-.566.239-.897 0-.707-.252-1.176-.755-1.409-.503-.232-1.27-.348-2.301-.348H2.836z"></path>
    </Icon>
  );
}

function CodeIcon(props) {
  return (
    <Icon {...props}>
      <path d="M9.95263 16.9123L8.59323 18.3608L2.03082 12.2016L8.18994 5.63922L9.64826 7.00791L4.85783 12.112L9.95212 16.8932L9.95263 16.9123Z" />
      <path d="M14.0474 16.9123L15.4068 18.3608L21.9692 12.2016L15.8101 5.63922L14.3517 7.00791L19.1422 12.112L14.0479 16.8932L14.0474 16.9123Z" />{' '}
    </Icon>
  );
}

function BulletListIcon(props) {
  return (
    <Icon {...props} style={{ transform: 'scale(1.4, 1.4)' }}>
      <path d="M9 7H7V9H9V7Z" />
      <path d="M7 13V11H9V13H7Z" />
      <path d="M7 15V17H9V15H7Z" />
      <path d="M11 15V17H17V15H11Z" />
      <path d="M17 13V11H11V13H17Z" />
      <path d="M17 7V9H11V7H17Z" />
    </Icon>
  );
}

function TodoListIcon(props) {
  return (
    <Icon {...props} style={{ transform: 'scale(0.8, 0.8)' }}>
      <path d="M10.2426 16.3137L6 12.071L7.41421 10.6568L10.2426 13.4853L15.8995 7.8284L17.3137 9.24262L10.2426 16.3137Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 5C1 2.79086 2.79086 1 5 1H19C21.2091 1 23 2.79086 23 5V19C23 21.2091 21.2091 23 19 23H5C2.79086 23 1 21.2091 1 19V5ZM5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3Z"
      />
    </Icon>
  );
}

function ItalicIcon(props) {
  return (
    <Icon {...props}>
      <path d="M11.4903 5.45801H17.4903L16.7788 7.32716H14.7788L11.2212 16.6729H13.2212L12.5097 18.5421H6.5097L7.22122 16.6729H9.22122L12.7788 7.32716H10.7788L11.4903 5.45801Z" />
    </Icon>
  );
}

function Heading2Icon(props) {
  return (
    <Icon {...props}>
      <text
        x="12"
        y="12"
        stroke="currentColor"
        textAnchor="middle"
        alignmentBaseline="central"
      >
        H2
      </text>
    </Icon>
  );
}

function Heading3Icon(props) {
  return (
    <Icon {...props}>
      <text
        x="12"
        y="12"
        stroke="currentColor"
        textAnchor="middle"
        alignmentBaseline="central"
      >
        H3
      </text>
    </Icon>
  );
}

function LinkIcon(props) {
  return (
    <Icon {...props}>
      <path d="M14.8284 12L16.2426 13.4142L19.071 10.5858C20.6331 9.02365 20.6331 6.49099 19.071 4.9289C17.509 3.3668 14.9763 3.3668 13.4142 4.9289L10.5858 7.75732L12 9.17154L14.8284 6.34311C15.6095 5.56206 16.8758 5.56206 17.6568 6.34311C18.4379 7.12416 18.4379 8.39049 17.6568 9.17154L14.8284 12Z" />
      <path d="M12 14.8285L13.4142 16.2427L10.5858 19.0711C9.02372 20.6332 6.49106 20.6332 4.92896 19.0711C3.36686 17.509 3.36686 14.9764 4.92896 13.4143L7.75739 10.5858L9.1716 12L6.34317 14.8285C5.56212 15.6095 5.56212 16.8758 6.34317 17.6569C7.12422 18.4379 8.39055 18.4379 9.1716 17.6569L12 14.8285Z" />
      <path d="M14.8285 10.5857C15.219 10.1952 15.219 9.56199 14.8285 9.17147C14.4379 8.78094 13.8048 8.78094 13.4142 9.17147L9.1716 13.4141C8.78107 13.8046 8.78107 14.4378 9.1716 14.8283C9.56212 15.2188 10.1953 15.2188 10.5858 14.8283L14.8285 10.5857Z" />
    </Icon>
  );
}

export function DoneIcon(props) {
  return (
    <Icon {...props}>
      <path d="M10.2426 16.3137L6 12.071L7.41421 10.6568L10.2426 13.4853L15.8995 7.8284L17.3137 9.24262L10.2426 16.3137Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12ZM12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z"
      />
    </Icon>
  );
}

export function ExternalIcon(props) {
  return (
    <Icon {...props}>
      <path d="M15.6396 7.02527H12.0181V5.02527H19.0181V12.0253H17.0181V8.47528L12.1042 13.3892L10.6899 11.975L15.6396 7.02527Z" />
      <path d="M10.9819 6.97473H4.98193V18.9747H16.9819V12.9747H14.9819V16.9747H6.98193V8.97473H10.9819V6.97473Z" />
    </Icon>
  );
}

export function CloseIcon(props) {
  return (
    <Icon {...props}>
      <path d="M16.34 9.32a1 1 0 10-1.36-1.46l-2.93 2.73-2.73-2.93a1 1 0 00-1.46 1.36l2.73 2.93-2.93 2.73a1 1 0 101.36 1.46l2.93-2.73 2.73 2.93a1 1 0 101.46-1.36l-2.73-2.93 2.93-2.73z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 12a11 11 0 1122 0 11 11 0 01-22 0zm11 9a9 9 0 110-18 9 9 0 010 18z"
      />
    </Icon>
  );
}
