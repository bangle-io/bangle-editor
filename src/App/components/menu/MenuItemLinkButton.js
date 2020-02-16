import React, { useState, useRef, useEffect } from 'react';
import { toggleMark } from 'prosemirror-commands';

import { MenuItemPropTypes } from 'Utils/bangle-utils/menu-plugin';
import { isMarkActive } from 'Utils/bangle-utils/prosemirror-utils';

import { MenuItemButton } from './MenuItemButton';

export function MenuItemLinkButton({
  editorState,
  editorView,
  schema,
  dispatch,
}) {
  const markType = schema.marks['link'];
  const [showInput, setShowInput] = useState(false);
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  let cmd;
  if (isMarkActive(editorState, markType)) {
    cmd = toggleMark(markType);
  } else {
    cmd = toggleMark(markType, {
      href: input.startsWith('https://') ? input : 'https://' + input,
      title: 'link',
    });
  }
  const active = isMarkActive(editorState, markType);
  const enabled = !editorState.selection.empty;

  useEffect(() => {
    if (showInput) {
      inputRef.current.focus();
    }
  }, [showInput]);

  if (showInput) {
    return (
      <input
        ref={inputRef}
        className="input"
        type="text"
        placeholder="Input url"
        value={input}
        style={{
          width: 200,
        }}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            setShowInput(false);
            setInput('');
            cmd(editorState, dispatch);
            // TODO: put the cursor right after the selection
            editorView.focus();
          }
        }}
        onChange={(e) => {
          setInput(e.target.value);
        }}
      />
    );
  }

  return (
    <MenuItemButton
      active={active}
      enabled={enabled}
      label="Link"
      iconType="link"
      onClick={() => {
        if (active) {
          cmd(editorState, dispatch);
          editorView.focus();
        } else if (!active) {
          return setShowInput(true);
        }
      }}
    />
  );
}

MenuItemLinkButton.propTypes = MenuItemPropTypes;
