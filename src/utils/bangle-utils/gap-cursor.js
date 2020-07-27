import { Selection } from 'prosemirror-state';

export class GapCursor {}

export class GapCursorSelection extends Selection {}

export const GapCursorSide = {
  LEFT: 'left',
  RIGHT: 'right',
};
