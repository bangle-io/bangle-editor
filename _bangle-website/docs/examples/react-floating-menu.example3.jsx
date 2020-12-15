import '@banglejs/core/style.css';
import '@banglejs/tooltip/style.css';
import '@banglejs/react-menu/style.css';
import React, { useCallback } from 'react';
import {
  BangleEditor,
  useEditorState,
  useEditorViewContext,
} from '@banglejs/react';
import {
  PluginKey,
  orderedList,
  bulletList,
  todoList,
  heading,
} from '@banglejs/core';
import { corePlugins, coreSpec } from '@banglejs/core/utils/core-components';
import {
  floatingMenu,
  FloatingMenu,
  Menu,
  HeadingButton,
  BulletListButton,
  MenuDropdown,
  MenuButton,
  TodoListButton,
  OrderedListButton,
  ParagraphButton,
  ChevronDown,
  ChevronUp,
} from '@banglejs/react-menu';

const menuKey = new PluginKey('menuKey');

export default function Example() {
  const editorState = useEditorState({
    specs: coreSpec(),
    plugins: () => [
      ...corePlugins(),
      floatingMenu.plugins({
        key: menuKey,
        tooltipRenderOpts: {
          placement: 'bottom',
        },
        calculateType: (state) =>
          !state.selection.empty ? 'defaultMenu' : null,
      }),
    ],
    initialValue: `<div>
      <p>Select me to change my type</p>
    </div>`,
  });

  return (
    <BangleEditor state={editorState}>
      <FloatingMenu
        menuKey={menuKey}
        renderMenuType={({ type }) => {
          if (type === 'defaultMenu') {
            return (
              <Menu>
                <MenuDropdown
                  parent={({ isDropdownVisible, toggleDropdown }) => (
                    <NodeTypeButton
                      isDropdownVisible={isDropdownVisible}
                      toggleDropdown={toggleDropdown}
                    />
                  )}
                >
                  <ParagraphButton hintPos="right">Paragraph</ParagraphButton>
                  <HeadingButton hintPos="right" level={1}>
                    Heading 1
                  </HeadingButton>
                  <BulletListButton hintPos="right">
                    Bullet List
                  </BulletListButton>
                  <OrderedListButton hintPos="right">
                    Ordered List
                  </OrderedListButton>
                  <TodoListButton hintPos="right">Todo List</TodoListButton>
                </MenuDropdown>
              </Menu>
            );
          }
          return null;
        }}
      />
    </BangleEditor>
  );
}

function NodeTypeButton({ isDropdownVisible, toggleDropdown }) {
  const view = useEditorViewContext();
  // using onMouseDown instead of onClick
  // helps preserve the editors selection.
  const onMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      toggleDropdown((show) => !show);
    },
    [toggleDropdown],
  );
  let name = 'paragraph';
  if (orderedList.queryIsOrderedListActive()(view.state)) {
    name = 'Ordered List';
  } else if (bulletList.queryIsBulletListActive()(view.state)) {
    name = 'Bullet List';
  } else if (todoList.queryIsTodoListActive()(view.state)) {
    name = 'Todo List';
  } else if (heading.queryIsHeadingActive(1)(view.state)) {
    name = 'Heading 1';
  }
  return (
    <MenuButton onMouseDown={onMouseDown} isDisabled={false}>
      <span>{name}</span>
      {isDropdownVisible ? <ChevronUp /> : <ChevronDown />}
    </MenuButton>
  );
}
