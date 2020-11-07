/** @jsx psx */
import { screen } from '@testing-library/dom';
import { renderTestEditor } from 'bangle-core/test-helpers/index';
import { SpecSheet } from 'bangle-core/spec-sheet';
import { corePlugins, coreSpec } from 'bangle-core/index';
import { psx } from 'bangle-react/test-helpers/psx';
import { bananaComponent } from './Banana';

describe('Inline node banana', () => {
  test('Inits banana', async () => {
    const banana = bananaComponent();
    const specSheet = new SpecSheet([...coreSpec(), banana.spec()]);
    const plugins = [...corePlugins()];
    const testEditor = renderTestEditor({ specSheet, plugins });

    const { view, editor } = testEditor(
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
    const plugins = [...corePlugins()];
    const testEditor = renderTestEditor({ specSheet, plugins });

    const { view, posLabels } = testEditor(
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
              data-testid="Can update attrs"
            >
              <div>
                I am 
                fresh
                 
                yellow
                 banana
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
              data-testid="Can update attrs"
            >
              <div>
                I am 
                fresh
                 
                brown
                 banana
              </div>
            </span>
          `);
  });
});
