/**
 * @jest-environment jsdom
 */
import '../../../test-helpers/jest-helpers';
import { fireEvent, wait, screen } from '@testing-library/react';
import { getVersion } from 'prosemirror-collab';
import {
  renderTestEditor,
  sendKeyToPm,
  sleep,
  typeText,
} from '../../../test-helpers';

import { Underline } from './../../../utils/bangle-utils/marks';
import {
  OrderedList,
  BulletList,
  ListItem,
  Heading,
  HardBreak,
  TodoList,
  TodoItem,
} from './../../../utils/bangle-utils/nodes';
import {
  doc,
  p,
  todoList,
  todoItem,
  nodeFactory,
} from './../../../test-helpers/test-builders';
import { CollabExtension } from '../client/collab-extension';

async function setupEditor(document, version) {
  const extensions = [
    new CollabExtension({
      version,
      clientID: 'test',
    }),
  ];
  return renderTestEditor(
    {
      extensions,
      content: document,
    },
    'data-test-' + Math.random(),
  )();
}

describe('One client - server', () => {
  it('works', async () => {});
});
