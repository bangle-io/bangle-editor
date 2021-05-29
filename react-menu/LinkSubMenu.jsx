import React, { useRef, useState } from 'react';
import { updateLink, queryLinkAttrs } from '@bangle.dev/core/components/link';
import * as Icons from './Icons';
import { useEditorViewContext } from '@bangle.dev/react';
import { MenuButton } from './Icon';
import { MenuGroup } from './MenuGroup';

export function LinkSubMenu({ getIsTop = () => true }) {
  const view = useEditorViewContext();
  const result = queryLinkAttrs()(view.state);
  const originalHref = (result && result.href) || '';

  return (
    <LinkMenu
      // (hackish) Using the key to unmount then mount
      // the linkmenu so that it discards any preexisting state
      // in its `href` and starts fresh
      key={originalHref}
      originalHref={originalHref}
      view={view}
      getIsTop={getIsTop}
    />
  );
}

function LinkMenu({ getIsTop, view, originalHref = '' }) {
  const [href, setHref] = useState(originalHref);
  const inputRef = useRef();
  const handleSubmit = () => {
    updateLink(href)(view.state, view.dispatch);
    view.focus();
  };

  return (
    <span className="bangle-link-menu">
      <input
        value={href}
        ref={inputRef}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
            view.focus();
            return;
          }
          const isTop = getIsTop();
          if (isTop && e.key === 'ArrowDown') {
            e.preventDefault();
            view.focus();
            return;
          }
          if (!isTop && e.key === 'ArrowUp') {
            e.preventDefault();
            view.focus();
            return;
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            view.focus();
            return;
          }
        }}
        onChange={(e) => {
          setHref(e.target.value);
          e.preventDefault();
        }}
      />
      <MenuGroup>
        <MenuButton
          hint="Visit"
          onMouseDown={(e) => {
            e.preventDefault();
            window.open(href, '_blank');
          }}
        >
          <Icons.ExternalIcon />
        </MenuButton>
      </MenuGroup>
      {href === originalHref ? (
        <MenuButton
          hint="Clear"
          onMouseDown={(e) => {
            e.preventDefault();
            updateLink()(view.state, view.dispatch);
            view.focus();
          }}
        >
          <Icons.CloseIcon />
        </MenuButton>
      ) : (
        <MenuButton
          hint="Save"
          onMouseDown={(e) => {
            e.preventDefault();
            handleSubmit();
            view.focus();
          }}
        >
          <Icons.DoneIcon />
        </MenuButton>
      )}
    </span>
  );
}
