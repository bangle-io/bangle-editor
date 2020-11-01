/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx, renderTestEditor2 } from '../index';

const testEditor = renderTestEditor2();

describe('Para empty selection', () => {
  test('Correct positions with inside paragraph', async () => {
    const { posLabels } = await testEditor(
      <doc>
        <para>hello w[]orld</para>
      </doc>,
    );

    expect(posLabels).toEqual({
      '[]': 8,
    });
  });

  test('Correct positions with inside paragraph', async () => {
    const { posLabels } = await testEditor(
      <doc>
        <para>hello world[]</para>
      </doc>,
    );

    expect(posLabels).toEqual({
      '[]': 12,
    });
  });

  test('Correct positions with inside paragraph', async () => {
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
  test('Correct positions with inside paragraph', async () => {
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

  test('Correct positions with inside paragraph', async () => {
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

  test('Correct positions with inside paragraph', async () => {
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

  test('Correct positions with inside paragraph', async () => {
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

  test('Correct positions with inside paragraph', async () => {
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

  test('Correct positions with inside paragraph', async () => {
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

  test('Correct positions with inside paragraph', async () => {
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

  test('Correct positions with inside paragraph', async () => {
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
