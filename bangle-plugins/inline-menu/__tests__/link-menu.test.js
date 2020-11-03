/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { coreSpec } from 'bangle-core/components';
import { link } from 'bangle-core/index';
import { SpecSheet } from 'bangle-core/spec-sheet';
import { psx, renderTestEditor } from 'bangle-core/test-helpers/index';
import { TextSelection } from 'prosemirror-state';
import { linkMenu } from '../index';
jest.mock('bangle-plugins/helpers/index', () => {
  return {
    viewHasFocus: () => true,
  };
});

const specSheet = new SpecSheet([...coreSpec(), linkMenu.spec()]);
const plugins = [link.plugins(), linkMenu.plugins()];

describe('Link menu', () => {
  test('when no link', async () => {
    const testEditor = renderTestEditor({ specSheet, plugins });
    const { view } = await testEditor(
      <doc>
        <para>foo[]bar</para>
      </doc>,
    );

    expect(view.dom.parentNode).toMatchSnapshot();
  });

  test('when link but not in selection', async () => {
    const testEditor = renderTestEditor({ specSheet, plugins });
    const { view } = await testEditor(
      <doc>
        <para>
          foo
          <link href="https://example.com">hello world</link>
          ba[]r
        </para>
      </doc>,
    );

    expect(view.dom).toMatchInlineSnapshot(`
      <div
        class="ProseMirror bangle-editor content"
        contenteditable="true"
      >
        <p>
          foo
          <a
            href="https://example.com"
            rel="noopener noreferrer nofollow"
          >
            hello world
          </a>
          bar
        </p>
      </div>
    `);
    expect(view.dom.parentNode).toMatchSnapshot();
  });

  test('when selection moves inside selection', async () => {
    const testEditor = renderTestEditor({ specSheet, plugins });

    const { view } = await testEditor(
      <doc>
        <para>
          foo
          <link href="https://example.com">hello world</link>
          ba[]r
        </para>
      </doc>,
    );

    let tooltipDOM = view.dom.parentElement.querySelector(
      '.bangle-tooltip[data-tooltip-name="link_menu_tooltip"]',
    );
    expect(tooltipDOM).toBeTruthy();
    expect(tooltipDOM.hasAttribute('data-show')).toBe(false);
    view.dispatch(
      view.state.tr.setSelection(
        TextSelection.create(view.state.doc, view.state.doc.content.size - 6),
      ),
    );

    expect(view.state.selection).toMatchInlineSnapshot(`
      Object {
        "anchor": 13,
        "head": 13,
        "type": "text",
      }
    `);

    expect(tooltipDOM.hasAttribute('data-show')).toBe(true);
  });
});
