/** @jsx pjsx */

import { screen } from '@testing-library/react';
import { SpecRegistry } from '@banglejs/core/spec-registry';
import {
  defaultPlugins,
  defaultSpecs,
} from '@banglejs/core/test-helpers/default-components';
import { pjsx, reactTestEditor } from './helpers/index';
import { bananaComponent, Banana } from './setup/banana';

const renderNodeViews = jest.fn(({ node, ...args }) => {
  if (node.type.name === 'banana') {
    return <Banana node={node} {...args} />;
  }
  throw new Error('Unknown node');
});

describe('Inline node banana', () => {
  test('Inits banana', async () => {
    const banana = bananaComponent();
    const specRegistry = new SpecRegistry([...defaultSpecs(), banana.spec()]);
    const plugins = [...defaultPlugins(), banana.plugins()];

    const testEditor = reactTestEditor({
      specRegistry,
      plugins,
      renderNodeViews,
    });

    const { view, editor } = await testEditor(
      <doc>
        <heading>Wow[]</heading>
        <para>
          Child <banana />
        </para>
      </doc>,
    );

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <heading>Wow[]</heading>
        <para>
          Child <banana />
        </para>
      </doc>,
    );

    expect(editor.toHTMLString()).toMatchSnapshot();
  });

  test('Can update attrs', async () => {
    const testId = 'Can update attrs';
    const banana = bananaComponent(testId);
    const specRegistry = new SpecRegistry([...defaultSpecs(), banana.spec()]);
    const plugins = [...defaultPlugins(), banana.plugins()];
    const testEditor = reactTestEditor({
      specRegistry,
      plugins,
      renderNodeViews,
    });

    const { view, posLabels } = await testEditor(
      <doc>
        <heading>Wow</heading>
        <para>
          Child <banana />
          []
        </para>
      </doc>,
    );

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <heading>Wow</heading>
        <para>
          Child <banana />
          []
        </para>
      </doc>,
    );

    const el = await screen.findByTestId(testId);
    await expect(el).toMatchInlineSnapshot(`
            <span
              data-bangle-container=""
              data-testid="Can update attrs"
              draggable="true"
            >
              <div
                data-color="yellow"
              >
                I am fresh yellow banana
              </div>
            </span>
          `);
    const bananaNodePos = posLabels['[]'] - 1;

    view.dispatch(
      view.state.tr.setNodeMarkup(bananaNodePos, undefined, {
        color: 'brown',
      }),
    );

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <heading>Wow</heading>
        <para>
          Child <banana color="brown" />
          []
        </para>
      </doc>,
    );

    await expect(el).toMatchInlineSnapshot(`
            <span
              data-bangle-container=""
              data-testid="Can update attrs"
              draggable="true"
            >
              <div
                data-color="brown"
              >
                I am fresh brown banana
              </div>
            </span>
          `);
  });
});
