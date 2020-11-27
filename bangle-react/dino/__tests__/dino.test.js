/**
 * @jest-environment jsdom
 */
/** @jsx pjsx */
import { reactTestEditor, pjsx } from '../../__tests__/helpers/index';
import { markdownSerializer } from 'bangle-plugins/markdown/index';
import { SpecRegistry } from 'bangle-core/spec-sheet';
import { dino } from '../index';
import {
  defaultPlugins,
  defaultSpecs,
} from 'bangle-core/test-helpers/default-components';

const specRegistry = new SpecRegistry([...defaultSpecs(), dino.spec()]);
const plugins = [...defaultPlugins(), dino.plugins()];

const renderNodeViews = jest.fn(({ node, ...args }) => {
  if (node.type.name === 'dino') {
    return <dino.Dino node={node} {...args} />;
  }
  throw new Error('Unknown node');
});
const testEditor = reactTestEditor({
  specRegistry,
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
      content = doc(specRegistry.schema);
    }
    return markdownSerializer(specRegistry).serialize(content);
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
