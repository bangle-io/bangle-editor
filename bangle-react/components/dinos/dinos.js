import { uuid } from 'bangle-core/utils/js-utils';
import { keymap } from 'bangle-core/utils/keymap';
import { NodeView } from 'bangle-core/node-view';
import { serializationHelpers } from 'bangle-core/node-view';
import { Plugin } from 'prosemirror-state';
import { createElement } from '../../utils/utils';

export const spec = specFactory;
export const plugins = pluginsFactory;

export const commands = {
  randomDino,
  insertDino,
};

const name = 'dinos';
const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory() {
  let spec = {
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
  };

  spec.schema = { ...spec.schema, ...serializationHelpers(spec) };

  return spec;
}

function pluginsFactory() {
  return ({ schema }) => [
    keymap({
      'Ctrl-B': randomDino(),
    }),
    new Plugin({
      props: {
        nodeViews: {
          [name]: (node, view, getPos, decorations) => {
            const containerDOM = createElement('span', {
              'data-uuid': name + '-' + uuid(4),
            });
            const mountDOM = createElement('span', {
              'data-uuid': name + '-react-' + uuid(4),
              'data-mount': 'true',
            });
            containerDOM.appendChild(mountDOM);

            return new NodeView({
              node,
              view,
              getPos,
              decorations,
              containerDOM,
              mountDOM: mountDOM,
            });
          },
        },
      },
    }),
  ];
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
