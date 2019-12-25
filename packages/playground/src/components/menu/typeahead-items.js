import { isMarkActive } from 'bangle-utils/src/prosemirror-utils';
import { toggleMark } from 'prosemirror-commands';

export const typeaheadItems = [
  {
    iconType: 'heading',
    label: 'Heading 2',
    getInsertNode: (editorState) => {
      return editorState.schema.nodes.heading.createChecked({ level: 2 });
    },
  },
  {
    iconType: 'heading',
    label: 'Heading 3',
    getInsertNode: (editorState) => {
      return editorState.schema.nodes.heading.createChecked({ level: 3 });
    },
  },
];
