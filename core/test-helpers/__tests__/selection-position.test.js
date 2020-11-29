/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx, renderTestEditor } from '../index';

const testEditor = renderTestEditor();

describe('Para empty selection', () => {
  test('Correct positions when inside paragraph', async () => {
    const { posLabels } = await testEditor(
      <doc>
        <para>hello w[]orld</para>
      </doc>,
    );

    expect(posLabels).toEqual({
      '[]': 8,
    });
  });

  test('Correct positions when inside paragraph when at end', async () => {
    const { posLabels } = await testEditor(
      <doc>
        <para>hello world[]</para>
      </doc>,
    );

    expect(posLabels).toEqual({
      '[]': 12,
    });
  });

  test('Correct positions when inside paragraph when at start', async () => {
    const { posLabels } = await testEditor(
      <doc>
        <para>[]hello world</para>
      </doc>,
    );

    expect(posLabels).toEqual({
      '[]': 1,
    });
  });
});
describe('Para non empty selection', () => {
  test('Correct positions when inside paragraph 1', async () => {
    const { posLabels } = await testEditor(
      <doc>
        <para>hello [w]orld</para>
      </doc>,
    );

    expect(posLabels).toEqual({
      '[': 7,
      ']': 8,
    });
  });

  test('Correct positions when inside paragraph 2', async () => {
    const { posLabels } = await testEditor(
      <doc>
        <para>hello [wo]rld</para>
      </doc>,
    );

    expect(posLabels).toEqual({
      '[': 7,
      ']': 9,
    });
  });

  test('Correct positions when inside paragraph 3', async () => {
    const { posLabels } = await testEditor(
      <doc>
        <para>hello [wor]ld</para>
      </doc>,
    );

    expect(posLabels).toEqual({
      '[': 7,
      ']': 10,
    });
  });

  test('Correct positions when inside paragraph', async () => {
    const { posLabels } = await testEditor(
      <doc>
        <para>[hello wor]ld</para>
      </doc>,
    );

    expect(posLabels).toEqual({
      '[': 1,
      ']': 10,
    });
  });

  test('Correct positions when inside paragraph with all text selected', async () => {
    const { posLabels } = await testEditor(
      <doc>
        <para>[hello world]</para>
      </doc>,
    );

    expect(posLabels).toEqual({
      '[': 1,
      ']': 12,
    });
  });

  test('Correct positions when inside paragraph when spanning multiple paragraph 1', async () => {
    const { posLabels } = await testEditor(
      <doc>
        <para>[hello world</para>
        <para>hello world]</para>
      </doc>,
    );

    expect(posLabels).toEqual({
      '[': 1,
      ']': 25,
    });
  });

  test('Correct positions when inside paragraph when spanning multiple paragraph 2', async () => {
    const { posLabels } = await testEditor(
      <doc>
        <para>hello world[</para>
        <para>]hello world</para>
      </doc>,
    );

    expect(posLabels).toEqual({
      '[': 12,
      ']': 14,
    });
  });

  test('Correct positions when inside paragraph when spanning multiple lists', async () => {
    const { posLabels } = await testEditor(
      <doc>
        <ul>
          <li>
            <para>hello world[</para>
          </li>
          <li>
            <para>]hello world</para>
          </li>
        </ul>
      </doc>,
    );

    expect(posLabels).toEqual({
      '[': 14,
      ']': 18,
    });
  });
});
