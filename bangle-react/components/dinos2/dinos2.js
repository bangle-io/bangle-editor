import { keymap } from 'bangle-core/utils/keymap';
import { Dino } from './Dino';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  randomDino,
  insertDino,
};

const name = 'name';
const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory() {
  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        'data-dinokind': {
          default: 'brontosaurus',
        },
        'data-type': {
          default: name,
        },
      },
      inline: true,
      group: 'inline',
      draggable: true,
    },
    markdown: {
      toMarkdown: (state, node) => {
        state.write('dino');
      },
    },

    nodeView: {
      render: Dino,
    },
  };
}

function pluginsFactory() {
  return keymap({
    'Ctrl-B': randomDino(),
  });
}

export const dinoNames = [
  'brontosaurus',
  'stegosaurus',
  'triceratops',
  'tyrannosaurus',
  'pterodactyl',
];

export function randomDino() {
  return (state, dispatch) =>
    insertDino(dinoNames[Math.floor(Math.random() * dinoNames.length)])(
      state,
      dispatch,
    );
}

export function insertDino(dinoName) {
  return (state, dispatch) => {
    const dinoType = getTypeFromSchema(state.schema);
    let { $from } = state.selection;
    let index = $from.index();

    if (!$from.parent.canReplaceWith(index, index, dinoType)) {
      return false;
    }
    if (dispatch) {
      const attr = {
        'data-dinokind': dinoName,
      };

      dispatch(state.tr.replaceSelectionWith(dinoType.create(attr)));
    }
    return true;
  };
}
