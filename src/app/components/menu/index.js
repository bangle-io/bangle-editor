import React from 'react';
import PropTypes from 'prop-types';
import { BaseButton } from '../Button';

export function MenuBar({ editor }) {
  return (
    <div className="flex p-2 flex-row content-center justify-center bg-gray-200 rounded">
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
        active={editor.isActive.bullet_list()}
        enabled={true}
        onClick={() => {
          editor.commands.bullet_list();
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
  return (
    <BaseButton
      onClick={onClick}
      isActive={active}
      faType={`fas fa-${iconType}`}
      disabled={!enabled}
      className="text-gray-900 hover:bg-gray-300 w-8 h-8"
      activeClassName="bg-gray-400"
    />
  );
}
MenuItemButton.propTypes = {
  active: PropTypes.bool.isRequired,
  enabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  iconType: PropTypes.string.isRequired,
};
