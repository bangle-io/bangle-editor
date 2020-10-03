/**
 * @jest-environment jsdom
 */

/** @jsx psx */

import {
  psx,
  typeText,
  sendKeyToPm,
  renderTestEditor,
} from 'bangle-core/test-helpers/index';

import { Heading } from 'bangle-core/nodes/index';
import { InlineSuggest } from '../inline-suggest';
import { sleep } from 'bangle-core/utils/js-utils';
import { typeChar } from 'bangle-core/test-helpers/index';
// due to some unknown issue, the view doesn't have focus
// when running test which causes tests to fail
jest.mock('bangle-plugins/helpers/index', () => {
  return {
    viewHasFocus: () => true,
  };
});

test.todo('the query long enough to be on two lines');

test.todo('query on an empty document');

test.todo('query at the end of document');

test.todo('at the start / end of a list');
test.todo('at the start / end of other blocks');

test('when no trigger', async () => {
  const extensions = [new Heading(), new InlineSuggest()];
  const testEditor = renderTestEditor({ extensions });
  const { editor } = await testEditor(
    <doc>
      <para>foo[]bar</para>
    </doc>,
  );

  expect(editor.view.dom.parentNode).toMatchInlineSnapshot(`
    <div
      id="test-editor"
    >
      <div
        class="ProseMirror bangle-editor content"
        contenteditable="true"
        tabindex="0"
      >
        <p>
          foobar
        </p>
      </div>
      <div
        id="bangle-tooltip"
        role="tooltip"
      >
        <div
          class="bangle-tooltip-content"
        >
          hello world
        </div>
      </div>
    </div>
  `);
});

test.only('types a trigger', async () => {
  const extensions = [
    new Heading(),
    new InlineSuggest({
      trigger: '$',
    }),
  ];
  const testEditor = renderTestEditor({ extensions });
  const { editor } = await testEditor(
    <doc>
      <para>foobar []</para>
    </doc>,
  );

  typeChar(editor.view, '/');
  // typeChar(editor.view, ' ');

  // sendKeyToPm(editor.view, '$');
  // type
  // await sleep(20);

  expect(editor.state).toEqualDocAndSelection(
    <doc>
      <para>
        foorbar <inline_suggest_c36>check</inline_suggest_c36>[]
      </para>
    </doc>,
  );

  expect(editor.view.dom.parentNode).toMatchInlineSnapshot(`
      <div
        id="test-editor"
      >
        <div
          class="ProseMirror bangle-editor content"
          contenteditable="true"
          tabindex="0"
        >
          <p>
            foobar
          </p>
        </div>
        <div
          id="bangle-tooltip"
          role="tooltip"
        >
          <div
            class="bangle-tooltip-content"
          >
            hello world
          </div>
        </div>
      </div>
    `);
});
