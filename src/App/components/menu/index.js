import React from 'react';
import PropTypes from 'prop-types';
import { ComponentUIWrapper } from 'Utils/bangle-utils/extensions/component-ui-wrapper';

export function MenuBar({ editor }) {
  return (
    <>
      <MenuItemButton
        active={editor.isActive.bold()}
        enabled={true}
        onClick={() => editor.commands.bold()}
        label="Bold"
        iconType="bold"
      />
      <MenuItemButton
        active={editor.isActive.italic()}
        enabled={true}
        onClick={() => editor.commands.italic()}
        label="Italic"
        iconType="italic"
      />
      <MenuItemButton
        active={editor.isActive.code()}
        enabled={true}
        onClick={() => editor.commands.code()}
        label="Code"
        iconType="code  "
      />
      <MenuItemButton
        enabled={true}
        onClick={() => editor.commands.undo()}
        label="Undo"
        iconType="undo"
      />
      <MenuItemButton
        enabled={true}
        onClick={() => editor.commands.redo()}
        label="Redo"
        iconType="redo"
      />
      <MenuItemButton
        active={editor.isActive.dino()}
        enabled={true}
        onClick={() => editor.commands.dino('brontosaurus')}
        label="Dino"
        iconType="ambulance"
      />
      <MenuItemButton
        active={editor.isActive.dino()}
        enabled={true}
        onClick={() => editor.commands.randomDino()}
        label="random-dino"
        iconType="bomb"
      />
      <MenuItemButton
        active={editor.isActive.emoji()}
        enabled={true}
        onClick={() => editor.commands.randomEmoji()}
        label="flower"
        iconType="smile"
      />
    </>
  );
}

export function MenuItemButton({ active, enabled, onClick, label, iconType }) {
  const buttonLook = active ? 'is-light' : 'is-white';
  return (
    <button
      className={`button ${buttonLook}`}
      disabled={enabled ? '' : 'disabled'}
      onClick={onClick}
    >
      <span className={`icon has-text-grey-dark`}>
        <i className={`fas fa-${iconType}`} title={label} />
      </span>
    </button>
  );
}
MenuItemButton.propTypes = {
  active: PropTypes.bool.isRequired,
  enabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  iconType: PropTypes.string.isRequired,
};

export const menuExtension = new ComponentUIWrapper(
  {
    childClass: 'menu-component',
  },
  MenuBar,
);
