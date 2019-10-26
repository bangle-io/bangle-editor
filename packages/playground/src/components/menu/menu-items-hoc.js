import React from 'react';
import PropTypes from 'prop-types';

const MenuItemPropTypes = {
  editorState: PropTypes.object.isRequired,
  schema: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
};

export function menuItemsHOC({
  iconType,
  label,
  getCommand,
  isActive = () => false,
  // default to dry running the command : dry run == run without dispatch
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
