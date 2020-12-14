/**
 * @jest-environment jsdom
 */

/** @jsx pjsx */
import { link } from '@banglejs/core/index';
import { SpecRegistry } from '@banglejs/core/spec-registry';
import { reactTestEditor, pjsx } from '@banglejs/react/__tests__/helpers/index';
import { TextSelection } from '@banglejs/core/prosemirror/state';
import { PluginKey } from '@banglejs/core/plugin';
import { floatingMenu } from '../index';
import { coreSpec } from '@banglejs/core/utils/core-components';

const menuKey = new PluginKey('floatingMenuTestKey');
const specRegistry = new SpecRegistry(coreSpec());
const plugins = () => [
  link.plugins(),
  floatingMenu.plugins({
    key: menuKey,
  }),
];

describe('Link menu', () => {
  test('when no link', async () => {
    const testEditor = reactTestEditor({ specRegistry, plugins });
    const { view, container } = await testEditor(
      <doc>
        <para>foo[]bar</para>
      </doc>,
    );

    expect(menuKey.getState(view.state)).toMatchObject({
      calculateType: expect.any(Function),
      show: false,
      tooltipContentDOM: expect.any(window.Node),
      type: null,
    });
    expect(container).toMatchSnapshot();
  });

  test('when link but not in selection', async () => {
    const testEditor = reactTestEditor({ specRegistry, plugins });
    const { view } = await testEditor(
      <doc>
        <para>
          foo
          <link href="https://example.com">hello world</link>
          ba[]r
        </para>
      </doc>,
    );

    expect(menuKey.getState(view.state)).toMatchObject({
      calculateType: expect.any(Function),
      show: false,
      tooltipContentDOM: expect.any(window.Node),
      type: null,
    });
  });

  test('when selection moves inside link', async () => {
    const testEditor = reactTestEditor({ specRegistry, plugins });
    const { view } = await testEditor(
      <doc>
        <para>
          foo
          <link href="https://example.com">hello world</link>
          ba[]r
        </para>
      </doc>,
    );

    expect(menuKey.getState(view.state)).toMatchObject({
      calculateType: expect.any(Function),
      show: false,
      tooltipContentDOM: expect.any(window.Node),
      type: null,
    });

    view.dispatch(
      view.state.tr.setSelection(
        TextSelection.create(view.state.doc, view.state.doc.content.size - 6),
      ),
    );

    expect(menuKey.getState(view.state)).toMatchObject({
      calculateType: expect.any(Function),
      show: true,
      tooltipContentDOM: expect.any(window.Node),
      type: 'linkSubMenu',
    });
  });
});
