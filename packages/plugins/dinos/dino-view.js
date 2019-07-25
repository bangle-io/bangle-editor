import { reactNodeViewHOC } from 'bangle-utils';

import { DINO_NODE_NAME } from './constants';

import { Dino } from './Dino';

export const DinoComponent = reactNodeViewHOC(Dino, DINO_NODE_NAME);
