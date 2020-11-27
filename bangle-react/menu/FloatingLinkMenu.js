import React, { useContext, useRef, useState } from 'react';
import {
  updateLinkAtSelection,
  queryLinkMarkAtSelection,
} from 'bangle-core/components/link';
import { EditorViewContext } from 'bangle-react/ReactEditor';
import { CloseIcon, DoneIcon, ExternalIcon } from './MenuIcons';

export function FloatingLinkMenu({ getIsTop = () => true }) {
  const view = useContext(EditorViewContext);
  const result = queryLinkMarkAtSelection()(view.state);
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
  const handleSubmit = (e) => {
    e.preventDefault();
    updateLinkAtSelection(href)(view.state, view.dispatch);
    view.focus();
  };

  return (
    <span className="bangle-link-menu">
      <input
        value={href}
        ref={inputRef}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSubmit(e);
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
        <ExternalIcon />
      </a>
      {href === originalHref ? (
        <CloseIcon
          onClick={() => {
            updateLinkAtSelection()(view.state, view.dispatch);
            view.focus();
          }}
        />
      ) : (
        <DoneIcon
          onClick={(e) => {
            handleSubmit(e);
            view.focus();
          }}
        />
      )}
    </span>
  );
}
