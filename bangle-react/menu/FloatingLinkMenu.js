import React, { useContext, useRef, useState } from 'react';
import {
  setLinkAtSelection,
  getLinkMarkDetails,
} from 'bangle-core/components/link';
import { EditorViewContext } from 'bangle-react/ReactEditor';
import { CloseIcon, DoneIcon, ExternalIcon } from './MenuIcons';

export function LinkMenu({ getIsTop = () => true }) {
  const view = useContext(EditorViewContext);

  const result = getLinkMarkDetails(view.state);
  const originalHref = result?.href || '';
  const [href, setHref] = useState(originalHref);
  const inputRef = useRef();
  const handleSubmit = (e) => {
    e.preventDefault();
    setLinkAtSelection(href)(view.state, view.dispatch);
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
            setLinkAtSelection()(view.state, view.dispatch);
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
