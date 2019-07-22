import React from 'react';
import classnames from 'classnames';

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
  pterodactyl: pterodactylImg
};

export function Dino({ attrs, selected }) {
  const type = attrs['data-type'];

  return React.createElement('img', {
    src: DINO_IMAGES[type],
    alt: type,
    className: classnames({
      mydino: true,
      plugins_dino: true,
      'ProseMirror-selectednode': selected,
      blink: attrs['data-blinks'] === 'yes'
    })
  });
}
