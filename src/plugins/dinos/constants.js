import v from '@mapbox/fusspot';

export const DINO_NODE_NAME = 'dino';
export const DINO_WRAPPER_ELEMENT = 'span';

export const dinoNames = [
  'brontosaurus',
  'stegosaurus',
  'triceratops',
  'tyrannosaurus',
  'pterodactyl'
];

export const dinoAttrTypes = {
  'data-type': v.required(v.oneOf(dinoNames)),
  'data-blinks': v.string
};
export const dinoAttrDefaults = {
  'data-type': 'brontosaurus'
};
