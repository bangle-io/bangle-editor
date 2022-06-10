/**
 * @jest-environment jsdom
 */
/** @jsx pjsx */
import { SpecRegistry } from '@bangle.dev/core';
import { defaultPlugins, defaultSpecs } from '@bangle.dev/all-base-components';
import { markdownSerializer } from '@bangle.dev/markdown';
import {
  pjsx,
  reactTestEditor,
} from '@bangle.dev/react/__tests__/helpers/index';
import { sticker } from '../src/index';

const specRegistry = new SpecRegistry([...defaultSpecs(), sticker.spec()]);
const plugins = () => [...defaultPlugins(), sticker.plugins()];

const renderNodeViews = jest.fn(({ node, ...args }) => {
  if (node.type.name === 'sticker') {
    return <sticker.Sticker node={node} {...args} />;
  }
  throw new Error('Unknown node');
});
const testEditor = reactTestEditor({
  specRegistry,
  plugins,
  renderNodeViews,
});

test('Rendering works', async () => {
  const { container, view } = await testEditor(
    <doc>
      <para>
        foo[]bar
        <sticker />
      </para>
    </doc>,
  );

  expect(view.state).toEqualDocAndSelection(
    <doc>
      <para>
        foo[]bar
        <sticker />
      </para>
    </doc>,
  );
  expect(container.querySelector(`.bangle-sticker`)).toMatchSnapshot();
});

test('Rendering works with different type of sticker', async () => {
  Date.now = jest.fn(() => 0);
  const { container, view } = await testEditor(
    <doc>
      <para>
        foo[]bar
        <sticker data-stickerkind="stegosaurus" />
      </para>
    </doc>,
  );

  expect(view.state).toEqualDocAndSelection(
    <doc>
      <para>
        foo[]bar
        <sticker data-stickerkind="stegosaurus" />
      </para>
    </doc>,
  );
  expect(container.querySelector(`.bangle-sticker`)).toMatchSnapshot();
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
          <sticker data-stickerkind="stegosaurus" />
        </para>
      </doc>,
    );
    expect(md).toMatchInlineSnapshot(`"hello worldsticker"`);
  });
});
