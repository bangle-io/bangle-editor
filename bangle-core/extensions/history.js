import { keymap } from 'prosemirror-keymap';
import * as pmHistory from 'prosemirror-history';

const name = 'history';

export const spec = (opts = {}) => {
  return {
    name,
    type: 'component',
  };
};

export const plugins = ({ depth = '', newGroupDelay = '' } = {}) => {
  return ({ schema }) => {
    return [
      pmHistory.history({
        depth: depth,
        newGroupDelay: newGroupDelay,
      }),
      keymap({
        'Mod-z': undo,
        'Mod-y': redo,
        'Shift-Mod-z': redo,
      }),
    ];
  };
};

export const undo = () => pmHistory.undo;
export const redo = () => pmHistory.redo;
export const undoDepth = () => pmHistory.undoDepth;
export const redoDepth = () => pmHistory.redoDepth;
