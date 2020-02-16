import React from 'react';
import classnames from 'classnames';
import { ReactNodeView, nodeHelpers } from 'Utils/bangle-utils';
import {
  DINO_NODE_NAME,
  dinoAttrTypes,
  dinoAttrDefaults,
  DINO_WRAPPER_ELEMENT,
  dinoNames,
} from './constants';
import { Node } from 'Utils/bangle-utils/helper-classes/node';

import brontosaurusImg from './img/brontosaurus.png';
import stegosaurusImg from './img/stegosaurus.png';
import triceratopsImg from './img/triceratops.png';
import tyrannosaurusImg from './img/tyrannosaurus.png';
import pterodactylImg from './img/pterodactyl.png';
import './dino.css';

export const DINO_IMAGES = {
  brontosaurus: brontosaurusImg,
  stegosaurus: stegosaurusImg,
  triceratops: triceratopsImg,
  tyrannosaurus: tyrannosaurusImg,
  pterodactyl: pterodactylImg,
};

class DinoComp extends ReactNodeView {
  constructor(props) {
    super(props);
    this.state = {
      selected: false,
    };
  }

  nodeViewSelectNode() {
    this.setState({
      selected: true,
    });
  }

  nodeViewDeselectNode() {
    this.setState({
      selected: false,
    });
  }

  render() {
    const { selected } = this.state;
    const attrs = nodeHelpers.getAttrsFromNode(
      dinoAttrTypes,
      this.nodeView.node,
    );

    const type = attrs['data-type'];
    return (
      <img
        src={DINO_IMAGES[type]}
        alt={type}
        className={classnames({
          'mydino': true,
          'plugins_dino': true,
          'ProseMirror-selectednode': selected,
          'blink': attrs['data-blinks'] === 'yes',
        })}
      />
    );
  }
}

export default class Dino extends Node {
  get name() {
    return DINO_NODE_NAME;
  }
  get schema() {
    return {
      attrs: nodeHelpers.attributesForNodeSpec(dinoAttrTypes, dinoAttrDefaults),
      inline: true,
      group: 'inline',
      draggable: true,
      // NOTE: Seems like this is used as an output to outside world
      //      when you like copy or drag
      toDOM: (node) => {
        return [
          DINO_WRAPPER_ELEMENT,
          nodeHelpers.attributesForToDom(dinoAttrTypes)(node),
        ];
      },
      // NOTE: this is the opposite part where you parse the output of toDOM
      //      When getAttrs returns false, the rule won't match
      //      Also, it only takes attributes defined in spec.attrs
      parseDOM: [
        {
          tag: DINO_WRAPPER_ELEMENT,
          getAttrs: nodeHelpers.attributesForParseDom(dinoAttrTypes),
        },
      ],
    };
  }
  get view() {
    return DinoComp;
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
}

function insertDino(schema, dinoName) {
  let dinoType = schema.nodes[DINO_NODE_NAME];
  return function(state, dispatch) {
    let { $from } = state.selection;
    let index = $from.index();

    if (!$from.parent.canReplaceWith(index, index, dinoType)) return false;
    if (dispatch) {
      const attr = {
        'data-type': dinoName,
      };

      if (dinoName === 'tyrannosaurus') {
        attr['data-blinks'] = 'yes';
      }

      dispatch(
        state.tr.replaceSelectionWith(
          dinoType.create(nodeHelpers.createAttrObj(dinoAttrTypes, attr)),
        ),
      );
    }
    return true;
  };
}
