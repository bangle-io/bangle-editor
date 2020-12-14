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
} from '@banglejs/react-menu';

const menuKey = new PluginKey('menuKey');

export default function Example() {
  const editorState = useEditorState({
    specs: coreSpec(),
    plugins: () => [
      ...corePlugins(),
      floatingMenu.plugins({
        key: menuKey,
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
                  <ParagraphButton>Paragraph</ParagraphButton>
                  <HeadingButton level={1}>Heading 1</HeadingButton>
                  <BulletListButton>Bullet List</BulletListButton>
                  <OrderedListButton>Ordered List</OrderedListButton>
                  <TodoListButton>Todo List</TodoListButton>
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

function NodeTypeButton({ toggleDropdown }) {
  const view = useEditorViewContext();
  const onSelect = useCallback(
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
    <MenuButton onMouseDown={onSelect} isDisabled={false}>
      <span>{name}</span>
    </MenuButton>
  );
}
