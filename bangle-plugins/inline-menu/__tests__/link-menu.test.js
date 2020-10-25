/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { Link } from 'bangle-core/index';
import { psx, renderTestEditor } from 'bangle-core/test-helpers';
import { TextSelection } from 'prosemirror-state';
import { LinkMenu } from '../link-menu';
jest.mock('bangle-plugins/helpers/index', () => {
  return {
    viewHasFocus: () => true,
  };
});

describe('Link menu', () => {
  test('when no link', async () => {
    const linkMenuPlugin = new LinkMenu();
    const extensions = [new Link(), linkMenuPlugin];
    const testEditor = renderTestEditor({ extensions });
    const { editor } = await testEditor(
      <doc>
        <para>foo[]bar</para>
      </doc>,
    );

    expect(editor.view.dom.parentNode).toMatchSnapshot();
  });

  test('when link but not in selection', async () => {
    const linkMenuPlugin = new LinkMenu();
    const extensions = [new Link(), linkMenuPlugin];
    const testEditor = renderTestEditor({ extensions });
    const { editor } = await testEditor(
      <doc>
        <para>
          foo
          <link href="https://example.com">hello world</link>
          ba[]r
        </para>
      </doc>,
    );

    expect(editor.view.dom).toMatchInlineSnapshot(`
      <div
        class="ProseMirror bangle-editor content"
        contenteditable="true"
        tabindex="0"
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
    expect(editor.view.dom.parentNode).toMatchSnapshot();
  });

  test('when selection moves inside selection', async () => {
    const linkMenuPlugin = new LinkMenu();
    const extensions = [new Link(), linkMenuPlugin];
    const testEditor = renderTestEditor({ extensions });
    const { editor } = await testEditor(
      <doc>
        <para>
          foo
          <link href="https://example.com">hello world</link>
          ba[]r
        </para>
      </doc>,
    );

    const { view } = editor;

    let tooltipDOM = editor.view.dom.parentElement.querySelector(
      '.bangle-tooltip[data-tooltip-name="inline_mark_tooltip"]',
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
