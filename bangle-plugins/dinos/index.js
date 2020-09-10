import './dino.css';

import React from 'react';
import { DINO_NODE_NAME, dinoNames } from './constants';
import { Node } from 'bangle-core/nodes';

import brontosaurusImg from './img/brontosaurus.png';
import stegosaurusImg from './img/stegosaurus.png';
import triceratopsImg from './img/triceratops.png';
import tyrannosaurusImg from './img/tyrannosaurus.png';
import pterodactylImg from './img/pterodactyl.png';

export const DINO_IMAGES = {
  brontosaurus: brontosaurusImg,
  stegosaurus: stegosaurusImg,
  triceratops: triceratopsImg,
  tyrannosaurus: tyrannosaurusImg,
  pterodactyl: pterodactylImg,
};

export default class Dino extends Node {
  get defaultOptions() {
    return {
      selectionStyle: { outline: '2px solid blue' },
    };
  }

  get name() {
    return DINO_NODE_NAME;
  }
  get schema() {
    return {
      attrs: {
        'data-dinokind': {
          default: 'brontosaurus',
        },
        'style': {
          default: 'display: inline-block;',
        },
        'data-type': {
          default: this.name,
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
            'data-type': this.name,
            'data-dinokind': node.attrs['data-dinokind'].toString(),
          },
        ];
      },
      // NOTE: this is the opposite part where you parse the output of toDOM
      //      When getAttrs returns false, the rule won't match
      //      Also, it only takes attributes defined in spec.attrs
      parseDOM: [
        {
          tag: `span[data-type="${this.name}"]`,
          getAttrs: (dom) => {
            return {
              'data-type': this.name,
              'data-dinokind': dom.getAttribute('data-dinokind'),
            };
          },
        },
      ],
    };
  }

  commands({ type, schema }) {
    return {
      dino: (dinoName) => insertDino(schema, dinoName),
      randomDino: () =>
        insertDino(
          schema,
          dinoNames[Math.floor(Math.random() * dinoNames.length)],
        ),
    };
  }

  keys({ schema, type }) {
    return {
      'Shift-Ctrl-b': insertDino(schema, 'brontosaurus'),
    };
  }

  render = (props) => {
    const { node, selected } = props;
    const type = node.attrs['data-dinokind'];
    return (
      <span
        contentEditable={false}
        style={selected ? this.options.selectionStyle : {}}
      >
        <img
          src={DINO_IMAGES[type]}
          alt={type}
          contentEditable={false}
          className="plugins_dino"
        />
      </span>
    );
  };
}

function insertDino(schema, dinoName) {
  let dinoType = schema.nodes[DINO_NODE_NAME];
  return function (state, dispatch) {
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
