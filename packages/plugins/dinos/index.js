import { Schema } from 'prosemirror-model';
import { MenuItem } from 'prosemirror-menu';
import brontosaurus from './img/brontosaurus.png';
import stegosaurus from './img/stegosaurus.png';
import triceratops from './img/triceratops.png';
import tyrannosaurus from './img/tyrannosaurus.png';
import pterodactyl from './img/pterodactyl.png';

export function insertSchema(schema) {
  const dinoSchema = new Schema({
    ...schema.spec,
    nodes: schema.spec.nodes.addBefore('image', 'dino', dinoNodeSpec)
  });
  return dinoSchema;
}

export function insertMenuItem(schema, menu) {
  Object.keys(dinos).forEach(name =>
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
}

function insertDino(schema, type) {
  let dinoType = schema.nodes.dino;

  return function(state, dispatch) {
    let { $from } = state.selection,
      index = $from.index();
    if (!$from.parent.canReplaceWith(index, index, dinoType)) return false;
    if (dispatch)
      dispatch(state.tr.replaceSelectionWith(dinoType.create({ type })));
    return true;
  };
}

// The supported types of dinosaurs.
const dinos = {
  brontosaurus,
  stegosaurus,
  triceratops,
  tyrannosaurus,
  pterodactyl
};
const dinoNodeSpec = {
  // Dinosaurs have one attribute, their type, which must be one of
  // the types defined above.
  // Brontosaurs are still the default dino.
  attrs: { type: { default: 'brontosaurus' } },
  inline: true,
  group: 'inline',
  draggable: true,

  // These nodes are rendered as images with a `dino-type` attribute.
  // There are pictures for all dino types under /img/dino/.
  toDOM: node => [
    'img',
    {
      'dino-type': node.attrs.type,
      src: dinos[node.attrs.type],
      title: node.attrs.type,
      class: 'dinosaur'
    }
  ],
  // When parsing, such an image, if its type matches one of the known
  // types, is converted to a dino node.
  parseDOM: [
    {
      tag: 'img[dino-type]',
      getAttrs: dom => {
        let type = dom.getAttribute('dino-type');
        return dinos.hasOwnProperty(type) ? { type } : false;
      }
    }
  ]
};
