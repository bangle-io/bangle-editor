import reactDOM from 'react-dom';
import React from 'react';
import { uuid } from 'bangle-core/utils/js-utils';
import { keymap } from 'bangle-core/utils/keymap';
import { NodeView } from 'bangle-core/utils/node-view';
import { Dino } from './Dino';
import { serializationHelpers } from 'bangle-core/utils/node-view-helpers';

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
    nodeView2: (node, view, getPos, decorations) => {
      const containerDOM = document.createElement('span');
      containerDOM.setAttribute('data-uuid', name + '-' + uuid(4));
      const reactContainerDOM = document.createElement('span');
      reactContainerDOM.setAttribute('data-uuid', name + '-react-' + uuid(4));
      containerDOM.appendChild(reactContainerDOM);

      return new NodeView({
        node,
        view,
        getPos,
        decorations,
        containerDOM,
        update({ node, view, getPos, decorations, selected }) {
          reactDOM.render(
            <Dino
              view={view}
              selected={selected}
              node={node}
              commands={commands}
            />,
            reactContainerDOM,
          );
        },
        destroy() {
          reactDOM.unmountComponentAtNode(reactContainerDOM);
          containerDOM.removeChild(reactContainerDOM);
        },
      });
    },
  };

  spec.schema = { ...spec.schema, ...serializationHelpers(spec) };

  return spec;
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
