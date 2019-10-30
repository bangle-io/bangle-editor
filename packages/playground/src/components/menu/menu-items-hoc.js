/* eslint-disable jsx-a11y/anchor-is-valid */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MenuItemPropTypes } from 'bangle-utils/src/menu-plugin';
import { MenuItemButton } from './MenuItemButton';

export function menuButtonHOC({
  iconType,
  label,
  getCommand,
  isActive = () => false,
  // default to dry running the command. Where `dry run` == run without dispatch
  isEnabled = (payload) => getCommand(payload)(payload.editorState),
}) {
  function IconMenuItem({ editorState, schema, dispatch, editorView }) {
    const payload = {
      editorState,
      schema,
    };
    const enabled = isEnabled(payload);
    return (
      <MenuItemButton
        active={isActive(payload)}
        enabled={enabled}
        onClick={(e) => {
          getCommand(payload)(editorState, dispatch);
          editorView.focus();
        }}
        label={label}
        iconType={iconType}
      />
    );
  }
  IconMenuItem.propTypes = MenuItemPropTypes;
  return IconMenuItem;
}

export function dropdownHOC({ label, renderItems }) {
  function DropdownContent({ externalProps, setActive }) {
    const dropdownRef = useRef(null);
    const handleClick = useCallback(
      (e) => {
        console.debug('calling');
        if (dropdownRef.current.contains(e.target)) {
          return;
        }
        // outside click
        setActive(false);
      },
      [setActive],
    );
    useEffect(() => {
      document.addEventListener('mousedown', handleClick);
      return () => {
        document.removeEventListener('mousedown', handleClick);
      };
    }, [handleClick]);

    return (
      <div className="dropdown-content" ref={dropdownRef}>
        {renderItems({ ...externalProps, onClick: () => setActive(false) })}
      </div>
    );
  }
  function Dropdown(props) {
    const [active, setActive] = useState(true);
    return (
      <div className={`dropdown is-white ${active ? 'is-active' : ''}`}>
        <div className="dropdown-trigger">
          <button
            className="button"
            aria-haspopup="true"
            aria-controls="dropdown-menu"
            onClick={() => !active && setActive(true)}
          >
            <span>{label}</span>
            <span className="icon is-small">
              <i className="fas fa-angle-down" aria-hidden="true"></i>
            </span>
          </button>
        </div>
        <div className="dropdown-menu" id="dropdown-menu" role="menu">
          {active && (
            <DropdownContent externalProps={props} setActive={setActive} />
          )}
        </div>
      </div>
    );
  }
  Dropdown.propTypes = MenuItemPropTypes;
  return Dropdown;
}
