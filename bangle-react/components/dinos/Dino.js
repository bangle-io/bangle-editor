import React from 'react';

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
        alt={DINO_IMAGES[nodeAttrs['data-dinokind']]}
      />
    </span>
  );
}
