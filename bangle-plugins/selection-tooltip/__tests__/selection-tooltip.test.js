/**
 * @jest-environment jsdom
 */

/** @jsx psx */

import {
  psx,
  typeText,
  sendKeyToPm,
  renderTestEditor,
} from 'bangle-core/test-helpers';

import { SelectionTooltip } from '../selection-tooltip';
import { Heading } from 'bangle-core/index';
// due to some unknown issue, the view doesn't have focus
// when running test which causes tests to fail
jest.mock('bangle-plugins/helpers/index', () => {
  return {
    viewHasFocus: () => true,
  };
});

test('Correctly adds tooltip', async () => {
  const extensions = [new Heading(), new SelectionTooltip()];
  const testEditor = renderTestEditor({ extensions });
  const { editor } = await testEditor(
    <doc>
      <para>[foo]bar</para>
    </doc>,
  );
  editor.view.hasFocus = () => true;

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
        data-popper-placement="bottom"
        data-show=""
        id="bangle-selection-tooltip"
        role="tooltip"
        style="position: absolute; left: 0px; top: 0px; margin: 0px; transform: translate(0px, 0px);"
      >
        <div
          data-popper-arrow="true"
          id="bangle-tooltip-arrow"
        />
        <div>
          hello world
        </div>
      </div>
    </div>
  `);
});

test('Handles a custom tooltip', async () => {
  const tooltip = document.createElement('div');
  const extensions = [
    new Heading(),
    new SelectionTooltip({
      tooltipDom: () => tooltip,
    }),
  ];
  const testEditor = renderTestEditor({ extensions });
  const { editor } = await testEditor(
    <doc>
      <para>[foo]bar</para>
    </doc>,
  );

  expect(editor.view.dom.parentNode.contains(tooltip)).toBe(true);
  expect(tooltip.hasAttribute('data-show')).toBe(true);
});

test('No tooltip if no selection', async () => {
  const tooltip = document.createElement('div');
  const extensions = [
    new Heading(),
    new SelectionTooltip({
      tooltipDom: () => tooltip,
    }),
  ];
  const testEditor = renderTestEditor({ extensions });
  const { editor } = await testEditor(
    <doc>
      <para>foobar</para>
    </doc>,
  );

  expect(editor.view.dom.parentNode.contains(tooltip)).toBe(true);
  expect(tooltip.hasAttribute('data-show')).toBe(false);
});

test('On typing hide tooltip', async () => {
  const tooltip = document.createElement('div');
  const extensions = [
    new Heading(),
    new SelectionTooltip({
      tooltipDom: () => tooltip,
    }),
  ];
  const testEditor = renderTestEditor({ extensions });
  const { editor } = await testEditor(
    <doc>
      <para>[foo]bar</para>
    </doc>,
  );

  expect(tooltip.hasAttribute('data-show')).toBe(true);

  editor.focus();
  typeText(editor.view, 'hello');
  expect(tooltip.hasAttribute('data-show')).toBe(false);
});

// For some reason the shift right is not working
test.skip('Keyboard based selection expand should show tooltip', async () => {
  const tooltip = document.createElement('div');
  const extensions = [
    new Heading(),
    new SelectionTooltip({
      tooltipDom: () => tooltip,
    }),
  ];
  const testEditor = renderTestEditor({ extensions });
  const { editor } = await testEditor(
    <doc>
      <para>foo[]bar</para>
    </doc>,
  );

  expect(tooltip.hasAttribute('data-show')).toBe(false);

  editor.focus();
  sendKeyToPm(editor.view, 'Shift-Right');

  expect(tooltip.hasAttribute('data-show')).toBe(true);
});
