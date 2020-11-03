import React from 'react';
import reactDOM from 'react-dom';

import { rafWrap } from 'bangle-core/utils/js-utils';
import { PluginKey } from 'prosemirror-state';
import {
  isSelectionInsideTodoList,
  toggleTodoList,
} from 'bangle-core/components/todo-list';
import {
  isItalicActiveInSelection,
  toggleItalic,
} from 'bangle-core/components/italic';
import {
  isSelectionInsideBulletList,
  toggleBulletList,
} from 'bangle-core/components/bullet-list';
import {
  toggleHeading,
  isSelectionInHeading,
} from 'bangle-core/components/heading';
import {
  isCodeActiveInSelection,
  toggleCode,
} from 'bangle-core/components/code';
import {
  isBoldActiveInSelection,
  toggleBold,
} from 'bangle-core/components/bold';
import { isSelectionInsideLink } from 'bangle-core/components/link';
import { pluginKeyStore } from 'bangle-plugins/utils';
import {
  hideAllSelectionTooltip,
  hideSelectionTooltip,
} from 'bangle-plugins/selection-tooltip/selection-tooltip';
import { isLinkMenuActive, showLinkMenu } from './link-menu';
import { selectionTooltip } from '../selection-tooltip/index';
import { Icon } from './icon-helpers';

const name = 'floating_menu';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  hideFloatingMenuTooltip,
};

const keyStore = pluginKeyStore();

const getSelectionTooltipKey = (parentKey) => {
  return keyStore.get(parentKey, parentKey.key + '__selectionTooltip');
};
const createTooltipKey = (parentKey) => {
  return keyStore.create(parentKey, parentKey.key + '__selectionTooltip');
};

function specFactory(opts = {}) {
  return {
    type: 'component',
    name,
  };
}

function pluginsFactory({
  key = new PluginKey('floating_menu'),
  getScrollContainerDOM = (view) => {
    return view.dom.parentElement;
  },
  linkMenuKey,
} = {}) {
  const { tooltipDOM, tooltipContent } = selectionTooltip.createTooltipDOM();
  const selectionTooltipKey = createTooltipKey(key);
  const Bold = {
    type: 'command',
    name: 'Bold',
    command: (state, dispatch, view) => {
      if (toggleBold(state, dispatch, view)) {
        if (dispatch) {
          view.focus();
        }
        return true;
      }
      return false;
    },
    component: BoldIcon,
    isActive: isBoldActiveInSelection,
  };

  const Italic = {
    type: 'command',
    name: 'Italic',
    command: (state, dispatch, view) => {
      if (toggleItalic(state, dispatch, view)) {
        if (dispatch) {
          view.focus();
        }
        return true;
      }
      return false;
    },
    component: ItalicIcon,
    isActive: isItalicActiveInSelection,
  };

  const Link = linkMenuKey && {
    type: 'command',
    name: 'Link',
    command: (state, dispatch, view) => {
      if (showLinkMenu(linkMenuKey)(state)) {
        if (dispatch) {
          console.log('hiding all');
          hideAllSelectionTooltip()(state, dispatch, view);
          setTimeout(
            () => showLinkMenu(linkMenuKey)(view.state, view.dispatch, view),
            0,
          );
          return true;
        }
        return true;
      }
      return false;
    },
    component: LinkIcon,
    isActive: isSelectionInsideLink,
  };

  const Code = {
    type: 'command',
    name: 'Code',
    command: (state, dispatch, view) => {
      if (toggleCode(state, dispatch, view)) {
        if (dispatch) {
          view.focus();
        }
        return true;
      }
      return false;
    },
    component: CodeIcon,
    isActive: isCodeActiveInSelection,
  };

  const BulletList = {
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
  };

  const TodoList = {
    type: 'command',
    name: 'TodoList',
    command: (state, dispatch, view) => {
      const allowed = toggleTodoList(state, undefined, view);
      if (allowed) {
        if (dispatch) {
          view.focus();
        }
        rafWrap(toggleTodoList)(state, dispatch, view);
        return true;
      }
      return false;
    },
    component: TodoListIcon,
    isActive: isSelectionInsideTodoList,
  };

  const Heading2 = {
    type: 'command',
    name: 'Heading2',
    command: (state, dispatch, view) => {
      const allowed = true;
      if (allowed) {
        if (dispatch) {
          view.focus();
        }
        return toggleHeading({ level: 2 })(state, dispatch, view);
      }
      return false;
    },
    component: Heading2Icon,
    isActive: isSelectionInHeading({ level: 2 }),
  };

  const Heading3 = {
    type: 'command',
    name: 'Heading3',
    command: (state, dispatch, view) => {
      const allowed = true;
      if (allowed) {
        if (dispatch) {
          view.focus();
        }
        return toggleHeading({ level: 3 })(state, dispatch, view);
      }
      return false;
    },
    component: Heading3Icon,
    isActive: isSelectionInHeading({ level: 3 }),
  };

  const menuItems = [
    [Bold, Italic, Link, Code].filter(Boolean),
    [Heading2, Heading3, BulletList, TodoList].filter(Boolean),
  ];

  const render = (state, dispatch, view) => {
    reactDOM.render(
      <Menu view={view}>
        {menuItems.map((group, index, array) => {
          if (!Array.isArray(group)) {
            group = [group];
          }
          const leftBorder = index !== 0 ? 'left-border' : '';
          const rightBorder = index !== array.length - 1 ? 'right-border' : '';
          return (
            <span
              key={index}
              className={`bangle-floating-menu-group ${leftBorder} ${rightBorder}`}
            >
              {group.map((item) => (
                <item.component
                  isActive={
                    item.isActive &&
                    item.isActive(view.state, view.dispatch, view)
                  }
                  // TODO still passing view because toggleListCommand needs view
                  // or it returns false
                  isDisabled={!item.command(state, undefined, view)}
                  hint={item.hint}
                  key={item.name}
                  onClick={(e) => {
                    e.preventDefault();
                    item.command(state, dispatch, view);
                  }}
                />
              ))}
            </span>
          );
        })}
      </Menu>,
      tooltipContent,
    );
    return true;
  };

  return selectionTooltip.plugins({
    key: selectionTooltipKey,
    tooltipName: 'floating_menu',
    tooltipDOM,
    getScrollContainerDOM,

    onHideTooltip: () => {
      reactDOM.unmountComponentAtNode(tooltipContent);
      return true;
    },

    onUpdateTooltip(state, dispatch, view) {
      const { head, from } = state.selection;
      if (this.popperInstance) {
        if (head === from) {
          this.popperInstance.setOptions({ placement: 'top' });
        } else {
          this.popperInstance.setOptions({ placement: 'bottom' });
        }
      }
      console.log('rending');
      render(state, dispatch, view);
      return true;
    },

    shouldShowTooltip: (state) => {
      // TODO floating menu should not be responsible for checking other tooltips
      return !state.selection.empty && !isLinkMenuActive(linkMenuKey)(state);
    },
  });
}

class Menu extends React.PureComponent {
  render() {
    return <span className="bangle-floating-menu">{this.props.children}</span>;
  }
}

const BoldIcon = (props) => {
  return (
    <Icon viewBox={'-6 -5 24 24'} {...props}>
      <path d="M5.997 14H1.72c-.618 0-1.058-.138-1.323-.415C.132 13.308 0 12.867 0 12.262V1.738C0 1.121.135.676.406.406.676.136 1.114 0 1.719 0h4.536c.669 0 1.248.041 1.738.124.49.083.93.242 1.318.478a3.458 3.458 0 0 1 1.461 1.752c.134.366.2.753.2 1.16 0 1.401-.7 2.426-2.1 3.075 1.84.586 2.76 1.726 2.76 3.42 0 .782-.2 1.487-.602 2.114a3.61 3.61 0 0 1-1.623 1.39 5.772 5.772 0 0 1-1.471.377c-.554.073-1.2.11-1.939.11zm-.21-6.217h-2.95v4.087h3.046c1.916 0 2.874-.69 2.874-2.072 0-.707-.248-1.22-.745-1.537-.496-.319-1.238-.478-2.225-.478zM2.837 2.13v3.619h2.597c.707 0 1.252-.067 1.638-.2.385-.134.68-.389.883-.765.16-.267.239-.566.239-.897 0-.707-.252-1.176-.755-1.409-.503-.232-1.27-.348-2.301-.348H2.836z"></path>
    </Icon>
  );
};

const ItalicIcon = (props) => {
  return (
    <Icon {...props}>
      <path d="M11.4903 5.45801H17.4903L16.7788 7.32716H14.7788L11.2212 16.6729H13.2212L12.5097 18.5421H6.5097L7.22122 16.6729H9.22122L12.7788 7.32716H10.7788L11.4903 5.45801Z" />
    </Icon>
  );
};

const LinkIcon = (props) => {
  return (
    <Icon {...props}>
      <path d="M14.8284 12L16.2426 13.4142L19.071 10.5858C20.6331 9.02365 20.6331 6.49099 19.071 4.9289C17.509 3.3668 14.9763 3.3668 13.4142 4.9289L10.5858 7.75732L12 9.17154L14.8284 6.34311C15.6095 5.56206 16.8758 5.56206 17.6568 6.34311C18.4379 7.12416 18.4379 8.39049 17.6568 9.17154L14.8284 12Z" />
      <path d="M12 14.8285L13.4142 16.2427L10.5858 19.0711C9.02372 20.6332 6.49106 20.6332 4.92896 19.0711C3.36686 17.509 3.36686 14.9764 4.92896 13.4143L7.75739 10.5858L9.1716 12L6.34317 14.8285C5.56212 15.6095 5.56212 16.8758 6.34317 17.6569C7.12422 18.4379 8.39055 18.4379 9.1716 17.6569L12 14.8285Z" />
      <path d="M14.8285 10.5857C15.219 10.1952 15.219 9.56199 14.8285 9.17147C14.4379 8.78094 13.8048 8.78094 13.4142 9.17147L9.1716 13.4141C8.78107 13.8046 8.78107 14.4378 9.1716 14.8283C9.56212 15.2188 10.1953 15.2188 10.5858 14.8283L14.8285 10.5857Z" />
    </Icon>
  );
};

const CodeIcon = (props) => {
  return (
    <Icon {...props}>
      <path d="M9.95263 16.9123L8.59323 18.3608L2.03082 12.2016L8.18994 5.63922L9.64826 7.00791L4.85783 12.112L9.95212 16.8932L9.95263 16.9123Z" />
      <path d="M14.0474 16.9123L15.4068 18.3608L21.9692 12.2016L15.8101 5.63922L14.3517 7.00791L19.1422 12.112L14.0479 16.8932L14.0474 16.9123Z" />{' '}
    </Icon>
  );
};

const BulletListIcon = (props) => {
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
};

const TodoListIcon = (props) => {
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
};

const Heading3Icon = (props) => {
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
};

const Heading2Icon = (props) => {
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
};

// Commands
export function hideFloatingMenuTooltip(key) {
  return hideSelectionTooltip(getSelectionTooltipKey(key));
}
