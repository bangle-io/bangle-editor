import React from 'react';
import { toggleMark } from 'prosemirror-commands';
import { MenuItemPropTypes } from './menu-item-proptypes';
import { isMarkActive } from '../prosemirror-utils';

function BoldMenuItem(props) {
  const strongMark = props.schema.marks.strong;
  const cmd = toggleMark(strongMark);
  const isEnabled = toggleMark(strongMark)(props.editorState);
  const isActive = isMarkActive(props.editorState, strongMark);

  return (
    <span
      onClick={(e) => {
        isEnabled && cmd(props.editorState, props.dispatch);
      }}
      className="menu-item-icon"
      style={{
        color: isActive ? 'red' : 'black',
      }}
    >
      <span className="icss-text-bold" />
    </span>
  );
}

function ItalicMenuItem(props) {
  const emMark = props.schema.marks.em;
  const cmd = toggleMark(emMark);
  const isEnabled = toggleMark(emMark)(props.editorState);
  const isActive = isMarkActive(props.editorState, emMark);

  return (
    <span
      onClick={(e) => {
        isEnabled && cmd(props.editorState, props.dispatch);
      }}
      className="menu-item-icon"
      style={{
        color: isActive ? 'red' : 'black',
      }}
    >
      <span className="icss-text-italic" />
    </span>
  );
}

export default [BoldMenuItem, ItalicMenuItem].map((fn) => {
  fn.propTypes = MenuItemPropTypes;
  return fn;
});

// :: Object
// A set of basic editor-related icons. Contains the properties
// `join`, `lift`, `selectParentNode`, `undo`, `redo`, `strong`, `em`,
// `code`, `link`, `bulletList`, `orderedList`, and `blockquote`, each
// holding an object that can be used as the `icon` option to
// `MenuItem`.
const icons = {
  join: {
    width: 800,
    height: 900,
    path:
      'M0 75h800v125h-800z M0 825h800v-125h-800z M250 400h100v-100h100v100h100v100h-100v100h-100v-100h-100z',
  },
  lift: {
    width: 1024,
    height: 1024,
    path:
      'M219 310v329q0 7-5 12t-12 5q-8 0-13-5l-164-164q-5-5-5-13t5-13l164-164q5-5 13-5 7 0 12 5t5 12zM1024 749v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12zM1024 530v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 310v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 91v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12z',
  },
  selectParentNode: { text: '\u2b1a', css: 'font-weight: bold' },
  undo: {
    width: 1024,
    height: 1024,
    path:
      'M761 1024c113-206 132-520-313-509v253l-384-384 384-384v248c534-13 594 472 313 775z',
  },
  redo: {
    width: 1024,
    height: 1024,
    path:
      'M576 248v-248l384 384-384 384v-253c-446-10-427 303-313 509-280-303-221-789 313-775z',
  },
  strong: {
    width: 805,
    height: 1024,
    path:
      'M317 869q42 18 80 18 214 0 214-191 0-65-23-102-15-25-35-42t-38-26-46-14-48-6-54-1q-41 0-57 5 0 30-0 90t-0 90q0 4-0 38t-0 55 2 47 6 38zM309 442q24 4 62 4 46 0 81-7t62-25 42-51 14-81q0-40-16-70t-45-46-61-24-70-8q-28 0-74 7 0 28 2 86t2 86q0 15-0 45t-0 45q0 26 0 39zM0 950l1-53q8-2 48-9t60-15q4-6 7-15t4-19 3-18 1-21 0-19v-37q0-561-12-585-2-4-12-8t-25-6-28-4-27-2-17-1l-2-47q56-1 194-6t213-5q13 0 39 0t38 0q40 0 78 7t73 24 61 40 42 59 16 78q0 29-9 54t-22 41-36 32-41 25-48 22q88 20 146 76t58 141q0 57-20 102t-53 74-78 48-93 27-100 8q-25 0-75-1t-75-1q-60 0-175 6t-132 6z',
  },
  em: {
    width: 585,
    height: 1024,
    path:
      'M0 949l9-48q3-1 46-12t63-21q16-20 23-57 0-4 35-165t65-310 29-169v-14q-13-7-31-10t-39-4-33-3l10-58q18 1 68 3t85 4 68 1q27 0 56-1t69-4 56-3q-2 22-10 50-17 5-58 16t-62 19q-4 10-8 24t-5 22-4 26-3 24q-15 84-50 239t-44 203q-1 5-7 33t-11 51-9 47-3 32l0 10q9 2 105 17-1 25-9 56-6 0-18 0t-18 0q-16 0-49-5t-49-5q-78-1-117-1-29 0-81 5t-69 6z',
  },
  code: {
    width: 896,
    height: 1024,
    path:
      'M608 192l-96 96 224 224-224 224 96 96 288-320-288-320zM288 192l-288 320 288 320 96-96-224-224 224-224-96-96z',
  },
  link: {
    width: 951,
    height: 1024,
    path:
      'M832 694q0-22-16-38l-118-118q-16-16-38-16-24 0-41 18 1 1 10 10t12 12 8 10 7 14 2 15q0 22-16 38t-38 16q-8 0-15-2t-14-7-10-8-12-12-10-10q-18 17-18 41 0 22 16 38l117 118q15 15 38 15 22 0 38-14l84-83q16-16 16-38zM430 292q0-22-16-38l-117-118q-16-16-38-16-22 0-38 15l-84 83q-16 16-16 38 0 22 16 38l118 118q15 15 38 15 24 0 41-17-1-1-10-10t-12-12-8-10-7-14-2-15q0-22 16-38t38-16q8 0 15 2t14 7 10 8 12 12 10 10q18-17 18-41zM941 694q0 68-48 116l-84 83q-47 47-116 47-69 0-116-48l-117-118q-47-47-47-116 0-70 50-119l-50-50q-49 50-118 50-68 0-116-48l-118-118q-48-48-48-116t48-116l84-83q47-47 116-47 69 0 116 48l117 118q47 47 47 116 0 70-50 119l50 50q49-50 118-50 68 0 116 48l118 118q48 48 48 116z',
  },
  bulletList: {
    width: 768,
    height: 896,
    path:
      'M0 512h128v-128h-128v128zM0 256h128v-128h-128v128zM0 768h128v-128h-128v128zM256 512h512v-128h-512v128zM256 256h512v-128h-512v128zM256 768h512v-128h-512v128z',
  },
  orderedList: {
    width: 768,
    height: 896,
    path:
      'M320 512h448v-128h-448v128zM320 768h448v-128h-448v128zM320 128v128h448v-128h-448zM79 384h78v-256h-36l-85 23v50l43-2v185zM189 590c0-36-12-78-96-78-33 0-64 6-83 16l1 66c21-10 42-15 67-15s32 11 32 28c0 26-30 58-110 112v50h192v-67l-91 2c49-30 87-66 87-113l1-1z',
  },
  blockquote: {
    width: 640,
    height: 896,
    path:
      'M0 448v256h256v-256h-128c0 0 0-128 128-128v-128c0 0-256 0-256 256zM640 320v-128c0 0-256 0-256 256v256h256v-256h-128c0 0 0-128 128-128z',
  },
};
