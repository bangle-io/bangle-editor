import React from 'react';
import {
  emojiLookup,
  emojiAttrTypes,
  EMOJI_WRAPPER_ELEMENT,
  EMOJI_NODE_NAME,
  emojiAttrDefaults
} from './constants';
import classnames from 'classnames';
import { ReactNodeView, nodeHelpers, reactNodeViewHOC } from 'bangle-utils';

class Emoji extends ReactNodeView {
  constructor(props) {
    super(props);
    this.state = {
      selected: false
    };
  }

  nodeViewSelectNode() {
    this.setState({
      selected: true
    });
  }

  nodeViewDeselectNode() {
    this.setState({
      selected: false
    });
  }

  render() {
    const { selected } = this.state;
    const attrs = nodeHelpers.getAttrsFromNode(
      // TODO high perfomance cost of getAttrsFromNode in render
      emojiAttrTypes,
      this.nodeView.node
    );

    const type = attrs['data-type'];

    return (
      <span
        className={classnames({
          'ProseMirror-selectednode': selected
        })}
      >
        {emojiLookup[type]}
      </span>
    );
  }
}

Emoji.Schema = {
  type: EMOJI_NODE_NAME,
  schema: {
    attrs: nodeHelpers.attributesForNodeSpec(emojiAttrTypes, emojiAttrDefaults),
    inline: true,
    group: 'inline',
    draggable: true,
    // NOTE: Seems like this is used as an output to outside world
    //      when you like copy or drag
    toDOM: node => {
      return [
        EMOJI_WRAPPER_ELEMENT,
        nodeHelpers.attributesForToDom(emojiAttrTypes)(node)
      ];
    },
    // NOTE: this is the opposite part where you parse the output of toDOM
    //      When getAttrs returns false, the rule won't match
    //      Also, it only takes attributes defined in spec.attrs
    parseDOM: [
      {
        tag: EMOJI_WRAPPER_ELEMENT,
        getAttrs: nodeHelpers.attributesForParseDom(emojiAttrTypes)
      }
    ]
  }
};

export default reactNodeViewHOC(Emoji);
