import React from 'react';

import brontosaurusImg from './img/brontosaurus.png';
import stegosaurusImg from './img/stegosaurus.png';
import triceratopsImg from './img/triceratops.png';
import tyrannosaurusImg from './img/tyrannosaurus.png';
import pterodactylImg from './img/pterodactyl.png';
import { keymap } from 'bangle-core/utils/keymap';
import { NodeView } from 'bangle-core/node-view';
import { domSerializationHelpers } from 'bangle-core/utils/dom-serialization-helpers';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  randomDino,
  insertDino,
};

const name = 'dino';
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
        'data-bangle-name': {
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

  spec.schema = {
    ...spec.schema,
    ...domSerializationHelpers(name, { tag: 'span' }),
  };

  return spec;
}

function pluginsFactory() {
  return ({ schema }) => [
    keymap({
      'Ctrl-B': randomDino(),
    }),
    NodeView.createPlugin({ name: 'dino', containerDOM: ['span'] }),
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

const DINO_IMAGES = {
  brontosaurus: brontosaurusImg,
  stegosaurus: stegosaurusImg,
  triceratops: triceratopsImg,
  tyrannosaurus: tyrannosaurusImg,
  pterodactyl: pterodactylImg,
};

// no children for this type
export function Dino({
  attributes = {},
  children,
  selected,
  node,
  commands,
  view,
}) {
  const nodeAttrs = node.attrs;
  return (
    <span
      {...attributes}
      style={selected ? { border: '4px solid pink' } : {}}
      className={`bangle-dino ${selected ? 'bangle-selected' : ''}`}
    >
      <img
        style={{
          display: 'inline',
          height: 24,
          verticalAlign: 'bottom',
          border: '1px solid #0ae',
          borderRadius: 4,
          background: '#ddf6ff',
        }}
        src={DINO_IMAGES[nodeAttrs['data-dinokind']]}
        alt={nodeAttrs['data-dinokind']}
      />
    </span>
  );
}
