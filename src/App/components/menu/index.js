import React from 'react';
import PropTypes from 'prop-types';

export function MenuBar({ editor }) {
  return (
    <div className="menu-bar-static">
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
        iconType="code"
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
      <MenuItemButton
        active={editor.isActive.ordered_list()}
        enabled={true}
        onClick={() => {
          editor.commands.ordered_list();
        }}
        label="flower"
        iconType="check-square"
      />
      <MenuItemButton
        active={editor.isActive.todo_list()}
        enabled={true}
        onClick={() => {
          editor.commands.todo_list();
        }}
        label="flower"
        iconType="check-square"
      />
    </div>
  );
}

export function MenuItemButton({ active, enabled, onClick, label, iconType }) {
  const buttonLook = active ? 'is-light' : 'is-white';
  return (
    <button
      className={`bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center ${buttonLook}`}
      disabled={enabled ? '' : 'disabled'}
      onClick={onClick}
    >
      <span className={`icon has-text-dark`}>
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
