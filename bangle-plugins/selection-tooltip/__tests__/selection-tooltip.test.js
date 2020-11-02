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

import { createTooltipDOM } from '../selection-tooltip';
import { selectionTooltip } from '../index';
import { corePlugins, coreSpec } from 'bangle-core/components';
import { PluginKey, TextSelection } from 'prosemirror-state';
// due to some unknown issue, the view doesn't have focus
// when running test which causes tests to fail
jest.mock('bangle-plugins/helpers/index', () => {
  return {
    viewHasFocus: () => true,
  };
});

describe('selection-tooltip', () => {
  let testEditor, tooltipDOM, tooltipContent;
  let key = new PluginKey('selection_tooltip');
  beforeEach(() => {
    ({ tooltipDOM, tooltipContent } = createTooltipDOM());
    tooltipContent.textContent = 'hello world';

    const editorSpec = [...coreSpec(), selectionTooltip.spec()];
    const plugins = [
      ...corePlugins(),
      selectionTooltip.plugins({ key, tooltipDOM }),
    ];

    testEditor = renderTestEditor({ editorSpec, plugins });
  });

  test('Correctly adds tooltip', async () => {
    const { view } = await testEditor(
      <doc>
        <para>[foo]bar</para>
      </doc>,
    );
    view.hasFocus = () => true;

    expect(view.dom.parentNode).toMatchInlineSnapshot(`
          <div
            data-testid="test-editor"
            id="test-editor"
          >
            <div
              class="ProseMirror bangle-editor content"
              contenteditable="true"
            >
              <p>
                foobar
              </p>
            </div>
            <div
              class="bangle-tooltip bangle-selection-tooltip"
              data-popper-placement="top"
              data-show=""
              data-tooltip-name="selection"
              role="tooltip"
              style="position: absolute; left: 0px; top: 0px; margin: 0px; bottom: 0px; transform: translate(0px, 0px);"
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

  test('Handles a custom tooltip', async () => {
    const { view } = await testEditor(
      <doc>
        <para>[foo]bar</para>
      </doc>,
    );

    expect(view.dom.parentNode.contains(tooltipDOM)).toBe(true);
    expect(tooltipDOM.hasAttribute('data-show')).toBe(true);
  });

  test('No tooltip if no selection', async () => {
    const { view } = await testEditor(
      <doc>
        <para>foobar</para>
      </doc>,
    );

    expect(view.dom.parentNode.contains(tooltipDOM)).toBe(true);
    expect(tooltipDOM.hasAttribute('data-show')).toBe(false);
  });

  test('On typing hide tooltip', async () => {
    const { view } = await testEditor(
      <doc>
        <para>[foo]bar</para>
      </doc>,
    );

    expect(tooltipDOM.hasAttribute('data-show')).toBe(true);

    typeText(view, 'hello');
    expect(tooltipDOM.hasAttribute('data-show')).toBe(false);
  });

  test('Collapsing selection should hide tooltip', async () => {
    const { view } = await testEditor(
      <doc>
        <para>f[oo]bar</para>
      </doc>,
    );

    expect(tooltipDOM.hasAttribute('data-show')).toBe(true);

    sendKeyToPm(view, 'Mod-Backspace');

    expect(tooltipDOM.hasAttribute('data-show')).toBe(false);
  });

  test('Pressing escape should hide tooltip', async () => {
    const { view } = await testEditor(
      <doc>
        <para>f[oo]bar</para>
      </doc>,
    );

    expect(tooltipDOM.hasAttribute('data-show')).toBe(true);

    sendKeyToPm(view, 'Escape');

    expect(tooltipDOM.hasAttribute('data-show')).toBe(false);
  });

  test('Creating a selection should show tooltip', async () => {
    const { view } = await testEditor(
      <doc>
        <para>foo[]bar</para>
      </doc>,
    );

    expect(tooltipDOM.hasAttribute('data-show')).toBe(false);

    const selection = TextSelection.create(view.state.doc, 3, 5);
    view.dispatch(view.state.tr.setSelection(selection));

    expect(tooltipDOM.hasAttribute('data-show')).toBe(true);
  });

  test('isTooltipActive should work', async () => {
    const { view } = await testEditor(
      <doc>
        <para>f[oo]bar</para>
      </doc>,
    );

    expect(tooltipDOM.hasAttribute('data-show')).toBe(true);

    expect(selectionTooltip.isSelectionTooltipActive(key)(view.state)).toBe(
      true,
    );
  });
});
