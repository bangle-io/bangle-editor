import React from 'react';
import classnames from 'classnames';
import { reactNodeViewHOC } from 'bangle-utils';
import { ReactNodeView, nodeHelpers } from 'bangle-utils';

import {
  DINO_NODE_NAME,
  dinoAttrTypes,
  dinoAttrDefaults,
  DINO_WRAPPER_ELEMENT,
} from './constants';

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

class Dino extends ReactNodeView {
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

Dino.Schema = {
  type: DINO_NODE_NAME,
  schema: {
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
  },
};

export default reactNodeViewHOC(Dino);
