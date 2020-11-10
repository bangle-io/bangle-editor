/**
 * @jest-environment jsdom
 */
/** @jsx pjsx */
import { markdownSerializer } from 'bangle-plugins/markdown/index';
import { corePlugins, coreSpec } from 'bangle-core/components';
import { SpecSheet } from 'bangle-core/spec-sheet';
import { reactTestEditor } from 'bangle-react/test-helpers/react-test-editor';
import { pjsx } from 'bangle-react/test-helpers/pjsx';
import { dino } from '../index';

const specSheet = new SpecSheet([...coreSpec(), dino.spec()]);
const plugins = [...corePlugins(), dino.plugins()];

const renderNodeViews = jest.fn(({ node, ...args }) => {
  if (node.type.name === 'dino') {
    return <dino.Dino node={node} {...args} />;
  }
  throw new Error('Unknown node');
});
const testEditor = reactTestEditor({
  specSheet,
  plugins,
  renderNodeViews,
});

test('Rendering works', async () => {
  Date.now = jest.fn(() => 0);
  const { container, view } = await testEditor(
    <doc>
      <para>
        foo[]bar
        <dino />
      </para>
    </doc>,
  );

  expect(view.state).toEqualDocAndSelection(
    <doc>
      <para>
        foo[]bar
        <dino />
      </para>
    </doc>,
  );
  expect(container.querySelector(`.bangle-dino`)).toMatchSnapshot();
});

test('Rendering works with different type of dino', async () => {
  Date.now = jest.fn(() => 0);
  const { container, view } = await testEditor(
    <doc>
      <para>
        foo[]bar
        <dino data-dinokind="stegosaurus" />
      </para>
    </doc>,
  );

  expect(view.state).toEqualDocAndSelection(
    <doc>
      <para>
        foo[]bar
        <dino data-dinokind="stegosaurus" />
      </para>
    </doc>,
  );
  expect(container.querySelector(`.bangle-dino`)).toMatchSnapshot();
});

describe('markdown', () => {
  const serialize = async (doc) => {
    let content = doc;
    if (typeof doc === 'function') {
      content = doc(specSheet.schema);
    }
    return markdownSerializer(specSheet).serialize(content);
  };

  test('markdown serialization', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello world
          <dino data-dinokind="stegosaurus" />
        </para>
      </doc>,
    );
    expect(md).toMatchInlineSnapshot(`"hello worlddino"`);
  });
});
