/** @jsx pjsx */

import { screen } from '@testing-library/dom';
import { SpecSheet } from 'bangle-core/spec-sheet';
import { corePlugins, coreSpec } from 'bangle-core/index';
import { pjsx, reactTestEditor } from 'bangle-react/__test-helpers__/index';
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
    const specSheet = new SpecSheet([...coreSpec(), banana.spec()]);
    const plugins = [...corePlugins(), banana.plugins()];

    const testEditor = reactTestEditor({ specSheet, plugins, renderNodeViews });

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
    const specSheet = new SpecSheet([...coreSpec(), banana.spec()]);
    const plugins = [...corePlugins(), banana.plugins()];
    const testEditor = reactTestEditor({ specSheet, plugins, renderNodeViews });

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
              data-bangle-name="banana"
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
              data-bangle-name="banana"
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
