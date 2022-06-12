/**
 * @jest-environment jsdom
 */

/** @jsx pjsx */
import { defaultSpecs } from '@bangle.dev/all-base-components';
import { link } from '@bangle.dev/base-components';
import { SpecRegistry } from '@bangle.dev/core';
import { NodeSelection, PluginKey, TextSelection } from '@bangle.dev/pm';
import {
  pjsx,
  reactTestEditor,
} from '@bangle.dev/react/__tests__/helpers/index';

import { floatingMenu } from '../src/index';

const menuKey = new PluginKey('floatingMenuTestKey');
const specRegistry = new SpecRegistry(defaultSpecs());

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

  test('when selection falling between two nodes', async () => {
    const testEditor = reactTestEditor({ specRegistry, plugins });
    const { view } = await testEditor(
      <doc>
        <para>foo[</para>
        <para>]bar</para>
      </doc>,
    );

    expect(menuKey.getState(view.state)).toMatchObject({
      calculateType: expect.any(Function),
      show: false,
      tooltipContentDOM: expect.any(window.Node),
      type: null,
    });
  });

  test('when selection falling between two nodes - different depth', async () => {
    const testEditor = reactTestEditor({ specRegistry, plugins });
    const { view } = await testEditor(
      <doc>
        <blockquote>
          <para>foo[</para>
        </blockquote>
        <para>]bar</para>
      </doc>,
    );

    expect(menuKey.getState(view.state)).toMatchObject({
      calculateType: expect.any(Function),
      show: false,
      tooltipContentDOM: expect.any(window.Node),
      type: null,
    });
  });

  test('when selection falling between two nodes - corner case', async () => {
    const testEditor = reactTestEditor({ specRegistry, plugins });
    const { view } = await testEditor(
      <doc>
        <para>foo[</para>
        <para>bar</para>
        <para>]baz</para>
      </doc>,
    );

    expect(menuKey.getState(view.state)).toMatchObject({
      calculateType: expect.any(Function),
      show: true,
      tooltipContentDOM: expect.any(window.Node),
      type: 'defaultMenu',
    });
  });

  test('when selection contains an atomic node', async () => {
    const testEditor = reactTestEditor({ specRegistry, plugins });
    const { view } = await testEditor(
      <doc>
        <para>
          <image src="http://example.com/foo.png" />
        </para>
      </doc>,
    );

    view.dispatch(
      view.state.tr.setSelection(NodeSelection.create(view.state.doc, 1)),
    );

    expect(menuKey.getState(view.state)).toMatchObject({
      calculateType: expect.any(Function),
      show: true,
      tooltipContentDOM: expect.any(window.Node),
      type: 'defaultMenu',
    });
  });
});

describe('works in link is not in schema', () => {
  test('works', async () => {
    const specRegistry = new SpecRegistry(defaultSpecs({ link: false }));

    const plugins = () => [
      floatingMenu.plugins({
        key: menuKey,
      }),
    ];

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
  });

  test('selecting works', async () => {
    const specRegistry = new SpecRegistry(defaultSpecs({ link: false }));

    const plugins = () => [
      floatingMenu.plugins({
        key: menuKey,
      }),
    ];

    const testEditor = reactTestEditor({ specRegistry, plugins });

    const { view, container } = await testEditor(
      <doc>
        <para>f[oo]bar</para>
      </doc>,
    );

    expect(menuKey.getState(view.state)).toMatchObject({
      calculateType: expect.any(Function),
      show: true,
      tooltipContentDOM: expect.any(window.Node),
      type: 'defaultMenu',
    });
  });
});
