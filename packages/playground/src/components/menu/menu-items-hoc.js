/* eslint-disable jsx-a11y/anchor-is-valid */

import React, { useState } from 'react';
import PropTypes from 'prop-types';

export const MenuItemPropTypes = {
  editorState: PropTypes.object.isRequired,
  schema: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
};

export function menuButtonHOC({
  iconType,
  label,
  getCommand,
  isActive = () => false,
  // default to dry running the command. Where `dry run` == run without dispatch
  isEnabled = (payload) => getCommand(payload)(payload.editorState),
}) {
  function IconMenuItem({ editorState, schema, dispatch }) {
    const payload = {
      editorState,
      schema,
    };
    const cmd = getCommand(payload);
    const active = isActive(payload);
    const enabled = isEnabled(payload);
    const buttonLook = enabled && active ? 'is-light' : 'is-white';
    return (
      <button
        className={`button ${buttonLook}`}
        disabled={enabled ? '' : 'disabled'}
      >
        <span
          onClick={(e) => {
            enabled && cmd(editorState, dispatch);
          }}
          className={`icon has-text-grey-dark`}
        >
          <i className={`fas fa-${iconType}`} title={label} />
        </span>
      </button>
    );
  }
  IconMenuItem.propTypes = MenuItemPropTypes;
  return IconMenuItem;
}

export function dropdownHOC({ label, renderItems }) {
  function Dropdown(props) {
    const [active, setActive] = useState(false);
    return (
      <div
        className={`dropdown is-white ${active ? 'is-active' : ''}`}
        onClick={() => setActive(!active)}
      >
        <div className="dropdown-trigger">
          <button
            className="button"
            aria-haspopup="true"
            aria-controls="dropdown-menu"
          >
            <span>{label}</span>
            <span className="icon is-small">
              <i className="fas fa-angle-down" aria-hidden="true"></i>
            </span>
          </button>
        </div>
        <div className="dropdown-menu" id="dropdown-menu" role="menu">
          <div className="dropdown-content">{renderItems(props)}</div>
        </div>
      </div>
    );
  }

  Dropdown.propTypes = MenuItemPropTypes;
  return Dropdown;
}
