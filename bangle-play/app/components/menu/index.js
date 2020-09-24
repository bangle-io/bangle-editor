import React from 'react';
import PropTypes from 'prop-types';
import { BaseButton } from '../Button';

export function MenuBar({ getEditor }) {
  return (
    <div className="flex p-2 flex-row content-center justify-center bg-gray-200 rounded">
      <MenuItemButton
        active={getEditor().isActive.bold()}
        enabled={true}
        onClick={() => getEditor().commands.bold()}
        label="Bold"
        iconType="bold"
      />
      <MenuItemButton
        active={getEditor().isActive.italic()}
        enabled={true}
        onClick={() => getEditor().commands.italic()}
        label="Italic"
        iconType="italic"
      />
      <MenuItemButton
        active={getEditor().isActive.code()}
        enabled={true}
        onClick={() => getEditor().commands.code()}
        label="Code"
        iconType="code"
      />
      <MenuItemButton
        enabled={true}
        onClick={() => getEditor().commands.undo()}
        label="Undo"
        iconType="undo"
      />
      <MenuItemButton
        enabled={true}
        onClick={() => getEditor().commands.redo()}
        label="Redo"
        iconType="redo"
      />
      <MenuItemButton
        active={getEditor().isActive.dino()}
        enabled={true}
        onClick={() => getEditor().commands.dino('brontosaurus')}
        label="Dino"
        iconType="ambulance"
      />
      <MenuItemButton
        active={getEditor().isActive.dino()}
        enabled={true}
        onClick={() => getEditor().commands.randomDino()}
        label="random-dino"
        iconType="bomb"
      />
      <MenuItemButton
        active={getEditor().isActive.emoji()}
        enabled={true}
        onClick={() => getEditor().commands.randomEmoji()}
        label="flower"
        iconType="smile"
      />
      <MenuItemButton
        active={getEditor().isActive.bullet_list()}
        enabled={true}
        onClick={() => {
          getEditor().commands.bullet_list();
        }}
        label="flower"
        iconType="check-square"
      />
      <MenuItemButton
        active={getEditor().isActive.todo_list()}
        enabled={true}
        onClick={() => {
          getEditor().commands.todo_list();
        }}
        label="flower"
        iconType="check-square"
      />
      <MenuItemButton
        active={getEditor().isActive.stopwatch()}
        enabled={true}
        onClick={() => {
          getEditor().commands.stopwatch();
        }}
        label="flower"
        iconType="stopwatch"
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
  active: PropTypes.bool,
  enabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  iconType: PropTypes.string.isRequired,
};
