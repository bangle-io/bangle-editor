import '@bangle.dev/core/style.css';
import '@bangle.dev/tooltip/style.css';
import '@bangle.dev/react-menu/style.css';
import React, { useCallback } from 'react';
import {
  BangleEditor,
  useEditorState,
  useEditorViewContext,
} from '@bangle.dev/react';
import { PluginKey, components } from '@bangle.dev/core';
import { corePlugins, coreSpec } from '@bangle.dev/core/utils/core-components';
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
} from '@bangle.dev/react-menu';

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
                  parent={({ isDropdownVisible, updateDropdown }) => (
                    <NodeTypeButton
                      isDropdownVisible={isDropdownVisible}
                      updateDropdown={updateDropdown}
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

function NodeTypeButton({ isDropdownVisible, updateDropdown }) {
  const view = useEditorViewContext();
  // using onMouseDown instead of onClick
  // helps preserve the editors selection.
  const onMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      updateDropdown((show) => !show);
    },
    [updateDropdown],
  );
  let name = 'paragraph';
  if (components.orderedList.queryIsOrderedListActive()(view.state)) {
    name = 'Ordered List';
  } else if (components.bulletList.queryIsBulletListActive()(view.state)) {
    name = 'Bullet List';
  } else if (components.bulletList.queryIsTodoListActive()(view.state)) {
    name = 'Todo List';
  } else if (components.heading.queryIsHeadingActive(1)(view.state)) {
    name = 'Heading 1';
  }
  return (
    <MenuButton onMouseDown={onMouseDown} isDisabled={false}>
      <span>{name}</span>
      {isDropdownVisible ? <ChevronUp /> : <ChevronDown />}
    </MenuButton>
  );
}
