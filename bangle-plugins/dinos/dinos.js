import React from 'react';
import { DINO_NODE_NAME, dinoNames } from './constants';
import { keymap } from 'prosemirror-keymap';

// TODO remove images as I am not sure how it will be consumed
import brontosaurusImg from './img/brontosaurus.png';
import stegosaurusImg from './img/stegosaurus.png';
import triceratopsImg from './img/triceratops.png';
import tyrannosaurusImg from './img/tyrannosaurus.png';
import pterodactylImg from './img/pterodactyl.png';
import { serializeAtomNodeToMdLink } from 'bangle-plugins/markdown/markdown-serializer';

export const DINO_IMAGES = {
  brontosaurus: brontosaurusImg,
  stegosaurus: stegosaurusImg,
  triceratops: triceratopsImg,
  tyrannosaurus: tyrannosaurusImg,
  pterodactyl: pterodactylImg,
};

const name = DINO_NODE_NAME;
const getTypeFromSchema = (schema) => schema.nodes[name];

export const spec = ({
  selectionStyle = { outline: '2px solid blue' },
} = {}) => {
  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        'data-dinokind': {
          default: 'brontosaurus',
        },
        'style': {
          default: 'display: inline-block;',
        },
        'data-type': {
          default: name,
        },
      },
      inline: true,
      group: 'inline',
      draggable: true,
      // NOTE: Seems like this is used as an output to outside world
      //      when you like copy or drag
      toDOM: (node) => {
        return [
          'span',
          {
            'data-type': name,
            'data-dinokind': node.attrs['data-dinokind'].toString(),
          },
        ];
      },
      // NOTE: this is the opposite part where you parse the output of toDOM
      //      When getAttrs returns false, the rule won't match
      //      Also, it only takes attributes defined in spec.attrs
      parseDOM: [
        {
          tag: `span[data-type="${name}"]`,
          getAttrs: (dom) => {
            return {
              'data-type': name,
              'data-dinokind': dom.getAttribute('data-dinokind'),
            };
          },
        },
      ],
    },
    markdown: {
      toMarkdown: (state, node) => {
        const string = serializeAtomNodeToMdLink(name, node.attrs);
        state.write(string);
      },
    },

    nodeView: {
      render: (props) => {
        const { node, selected } = props;
        const type = node.attrs['data-dinokind'];
        return (
          <span contentEditable={false} style={selected ? selectionStyle : {}}>
            <img
              src={DINO_IMAGES[type]}
              alt={type}
              contentEditable={false}
              className="plugins_dino"
            />
          </span>
        );
      },
    },
  };
};

export const plugins = ({ keys = { insertDino: 'Shift-Ctrl-b' } } = {}) => {
  return () => {
    return [
      keymap({
        [keys.insertDino]: randomDino(),
      }),
    ];
  };
};

export const randomDino = () => {
  return (state, dispatch) =>
    insertDino(dinoNames[Math.floor(Math.random() * dinoNames.length)])(
      state,
      dispatch,
    );
};

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
