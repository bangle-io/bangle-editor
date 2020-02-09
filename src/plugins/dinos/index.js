import React from 'react';
import { MenuItem } from 'prosemirror-menu';
import classnames from 'classnames';
import { Fragment, Node } from 'prosemirror-model';

import { DINO_NODE_NAME, dinoAttrTypes, dinoNames } from './constants';
import { nodeHelpers } from 'Utils/bangle-utils';
import './dino.css';
import { DINO_IMAGES } from './Dino';

export { default as DinoComponent } from './Dino';

export function insertMenuItem(schema) {
  return menu => {
    dinoNames.forEach(name =>
      menu.insertMenu.content.push(
        new MenuItem({
          title: 'Insert ' + name,
          label: name.charAt(0).toUpperCase() + name.slice(1),
          enable(state) {
            return insertDino(schema, name)(state);
          },
          run: insertDino(schema, name)
        })
      )
    );
    return menu;
  };
}

function insertDino(schema, type) {
  let dinoType = schema.nodes[DINO_NODE_NAME];
  return function(state, dispatch) {
    let { $from } = state.selection;
    let index = $from.index();

    if (!$from.parent.canReplaceWith(index, index, dinoType)) return false;
    if (dispatch) {
      const attr = {
        'data-type': type
      };

      if (type === 'tyrannosaurus') {
        attr['data-blinks'] = 'yes';
      }

      dispatch(
        state.tr.replaceSelectionWith(
          dinoType.create(nodeHelpers.createAttrObj(dinoAttrTypes, attr))
        )
      );
    }
    return true;
  };
}

export const typeaheadItems = [
  ...dinoNames.map(dinoName => ({
    icon: (
      <img
        src={DINO_IMAGES[dinoName]}
        alt={dinoName}
        className={classnames({
          mydino: true,
          plugins_dino: true
        })}
      />
    ),
    title: 'Insert ' + dinoName,
    getInsertNode: editorState => {
      const attr = {
        'data-type': dinoName
      };
      if (dinoName === 'tyrannosaurus') {
        attr['data-blinks'] = 'yes';
      }

      return editorState.schema.nodes[DINO_NODE_NAME].create(
        nodeHelpers.createAttrObj(dinoAttrTypes, attr)
      );
    }
  }))
];

export default () => ({
  menu: {
    rows: [
      ...dinoNames.map(dinoName => ({
        icon: (
          <img
            src={DINO_IMAGES[dinoName]}
            alt={dinoName}
            className={classnames({
              mydino: true,
              plugins_dino: true
            })}
          />
        ),
        title: 'Insert ' + dinoName,
        subtitle: 'Puts a cute ' + dinoName + ' emoji.',
        getCommand: ({ schema }) => insertDino(schema, dinoName),
        isEnabled: () => true
      }))
    ]
  }
});
