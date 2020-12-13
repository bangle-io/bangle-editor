import React from 'react';
import { rafCommandExec } from '@banglejs/core/utils/js-utils';

import {
  CodeButton,
  TodoListButton,
  BoldButton,
  ItalicButton,
  BulletListButton,
  HeadingButton,
  LinkButton,
} from './MenuIcons';
import {
  focusFloatingMenuInput,
  toggleFloatingLinkMenu,
} from './floating-menu';
import { useEditorViewContext } from '@banglejs/react/hooks';

function MenuGroup({ children, border = 'right' }) {
  return (
    <span className={`bangle-menu-group ${border}-border`}>{children}</span>
  );
}
export function Menu({ menuKey }) {
  const view = useEditorViewContext();

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="bangle-menu">
        <MenuGroup>
          <BoldButton />
          <ItalicButton />
          <CodeButton />
          <LinkButton
            showLinkMenu={() => {
              toggleFloatingLinkMenu(menuKey)(view.state, view.dispatch, view);
              rafCommandExec(view, focusFloatingMenuInput(menuKey));
            }}
          />
        </MenuGroup>
        <MenuGroup>
          <HeadingButton level={2} />
          <HeadingButton level={3} />
          <BulletListButton />
          <TodoListButton />
        </MenuGroup>
      </div>
      {/* <div
        className="bangle-menu"
        style={{
          position: 'absolute',
          top: 30,
          marginTop: '5px',
        }}
      >
        YOYOYUO
      </div> */}
    </div>
  );
}
