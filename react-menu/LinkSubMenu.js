import React, { useRef, useState } from 'react';
import { updateLink, queryLinkAttrs } from '@banglejs/core/components/link';
import * as Icons from './Icons';
import { useEditorViewContext } from '@banglejs/react/hooks';

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
    <>
      <input
        value={href}
        ref={inputRef}
        onKeyDown={(e) => {
          console.log(e.key);
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
      <a href={href} target="_blank" rel="noreferrer">
        <Icons.ExternalIcon hint="Visit Link" />
      </a>
      {href === originalHref ? (
        <Icons.CloseIcon
          hint="Clear Link"
          onSelect={() => {
            updateLink()(view.state, view.dispatch);
            view.focus();
          }}
        />
      ) : (
        <Icons.DoneIcon
          onSelect={() => {
            handleSubmit();
            view.focus();
          }}
        />
      )}
    </>
  );
}
