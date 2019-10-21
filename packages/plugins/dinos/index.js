import { MenuItem } from 'prosemirror-menu';

import { DINO_NODE_NAME, dinoAttrTypes, dinoNames } from './constants';
import { nodeHelpers } from 'bangle-utils';
import './dino.css';

export { default as DinoComponent } from './Dino';

export function insertMenuItem(schema) {
  return (menu) => {
    dinoNames.forEach((name) =>
      menu.insertMenu.content.push(
        new MenuItem({
          title: 'Insert ' + name,
          label: name.charAt(0).toUpperCase() + name.slice(1),
          enable(state) {
            return insertDino(schema, name)(state);
          },
          run: insertDino(schema, name),
        }),
      ),
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
        'data-type': type,
      };

      if (type === 'tyrannosaurus') {
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
