/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import { psx, renderTestEditor } from 'bangle-core/test-helpers/';
import { markdownSerializer } from 'bangle-plugins/markdown/index';
import { corePlugins, coreSpec } from 'bangle-core/components';
import { dinos } from '../index';
import { SpecSheet } from 'bangle-core/spec-sheet';

const specSheet = new SpecSheet([...coreSpec(), dinos.spec()]);
const plugins = [...corePlugins(), dinos.plugins()];

const testEditor = renderTestEditor({
  specSheet,
  plugins,
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
  expect(container.querySelector(`[data-type="dino"]`)).toMatchSnapshot();
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
  expect(container.querySelector(`[data-type="dino"]`)).toMatchSnapshot();
});

describe('markdown', () => {
  let schemaPromise;
  const serialize = async (doc) => {
    let content = doc;
    if (typeof doc === 'function') {
      content = doc(await schemaPromise);
    }
    return markdownSerializer(specSheet).serialize(content);
  };

  beforeAll(async () => {
    schemaPromise = renderTestEditor({ specSheet, plugins })().then(
      (r) => r.schema,
    );
  });

  test('markdown serialization', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello world
          <dino data-dinokind="stegosaurus" />
        </para>
      </doc>,
    );
    expect(md).toMatchInlineSnapshot(
      `"hello world[$dino](bangle://data-dinokind=%22stegosaurus%22&data-type=%22dino%22)"`,
    );
  });
});
