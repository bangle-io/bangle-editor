/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import fs from 'fs/promises';
import path from 'path';

import { psx } from '@bangle.dev/test-helpers';

import { parse, serialize } from './setup';

describe('Markdown table parsing', () => {
  test('table1.md: a simple table', async () => {
    const doc = (
      <doc>
        <heading>My Table</heading>
        <table>
          <table_row>
            <table_header align="left">
              <para>NOTE:</para>
            </table_header>
          </table_row>
          <table_row>
            <table_cell align="left">
              <para>Work in progress</para>
            </table_cell>
          </table_row>
        </table>
      </doc>
    );

    const md = await fs.readFile(
      path.join(__dirname, './fixtures/table1.md'),
      'utf-8',
    );
    const resultDoc = await parse(md);
    expect(resultDoc).toEqualDocument(doc);

    // check serializing
    expect(await serialize(doc)).toMatchSnapshot();
    const parsedDoc = await parse(await serialize(doc));
    expect(parsedDoc).toEqualDocument(doc);
  });

  test('table2.md: two simple table with two columns', async () => {
    // there two tables that differ with their heading syntax
    const t1 = (
      <table>
        <table_row>
          <table_header>
            <para>Header 1</para>
          </table_header>
          <table_header>
            <para>Header 2</para>
          </table_header>
        </table_row>
        <table_row>
          <table_cell>
            <para>hello</para>
          </table_cell>
          <table_cell>
            <para>world</para>
          </table_cell>
        </table_row>
      </table>
    );
    const doc = (
      <doc>
        <heading>Table 2</heading>
        {t1}
        {t1}
      </doc>
    );

    const md = await fs.readFile(
      path.join(__dirname, './fixtures/table2.md'),
      'utf-8',
    );
    const resultDoc = await parse(md);

    expect(resultDoc).toEqualDocument(doc);

    // check serializing
    expect(await serialize(doc)).toMatchSnapshot();
    const parsedDoc = await parse(await serialize(doc));
    expect(parsedDoc).toEqualDocument(doc);
  });

  test('table3.md: with alignment', async () => {
    const doc = (
      <doc>
        <heading>Table 3</heading>
        <table>
          <table_row>
            <table_header>
              <para>Default</para>
            </table_header>
            <table_header align="left">
              <para>Left</para>
            </table_header>
            <table_header align="center">
              <para>Center</para>
            </table_header>
            <table_header align="right">
              <para>Right</para>
            </table_header>
          </table_row>
          <table_row>
            <table_cell>
              <para>x</para>
            </table_cell>
            <table_cell align="left">
              <para>x</para>
            </table_cell>
            <table_cell align="center">
              <para>x</para>
            </table_cell>
            <table_cell align="right">
              <para>x</para>
            </table_cell>
          </table_row>
        </table>
      </doc>
    );

    const md = await fs.readFile(
      path.join(__dirname, './fixtures/table3.md'),
      'utf-8',
    );
    const resultDoc = await parse(md);

    expect(resultDoc).toEqualDocument(doc);

    // check serializing
    expect(await serialize(doc)).toMatchSnapshot();
    const parsedDoc = await parse(await serialize(doc));
    expect(parsedDoc).toEqualDocument(doc);
  });

  test('table4.md', async () => {
    const doc = (
      <doc>
        <heading>Table 4</heading>
        <table>
          <table_row>
            <table_header align="center">
              <para>foo</para>
            </table_header>
            <table_header align="right">
              <para>goo</para>
            </table_header>
          </table_row>
          <table_row>
            <table_cell align="center">
              <para>bar</para>
            </table_cell>
            <table_cell align="right">
              <para>baz</para>
            </table_cell>
          </table_row>
        </table>
      </doc>
    );

    const md = await fs.readFile(
      path.join(__dirname, './fixtures/table4.md'),
      'utf-8',
    );
    const resultDoc = await parse(md);
    expect(resultDoc).toEqualDocument(doc);

    // check serializing
    expect(await serialize(doc)).toMatchSnapshot();
    const parsedDoc = await parse(await serialize(doc));
    expect(parsedDoc).toEqualDocument(doc);
  });

  test('table5.md', async () => {
    const doc = (
      <doc>
        <heading>Table 5</heading>
        <table>
          <table_row>
            <table_header>
              <para>f|oo</para>
            </table_header>
          </table_row>
          <table_row>
            <table_cell>
              <para>
                b <code>\|</code> az
              </para>
            </table_cell>
          </table_row>
          <table_row>
            <table_cell>
              <para>
                b <bold>|</bold> im
              </para>
            </table_cell>
          </table_row>
        </table>
      </doc>
    );

    const md = await fs.readFile(
      path.join(__dirname, './fixtures/table5.md'),
      'utf-8',
    );
    const resultDoc = await parse(md);
    expect(resultDoc).toEqualDocument(doc);

    // check serializing
    expect(await serialize(doc)).toMatchSnapshot();
    const parsedDoc = await parse(await serialize(doc));
    expect(parsedDoc).toEqualDocument(doc);
  });

  test('table6.md', async () => {
    const doc = (
      <doc>
        <heading>Table 6</heading>
        <table>
          <table_row>
            <table_header>
              <para>abc</para>
            </table_header>
            <table_header>
              <para>def</para>
            </table_header>
          </table_row>
          <table_row>
            <table_cell>
              <para>bar</para>
            </table_cell>
            <table_cell>
              <para>baz</para>
            </table_cell>
          </table_row>
        </table>
        <blockquote>
          <para>bar</para>
        </blockquote>
      </doc>
    );

    const md = await fs.readFile(
      path.join(__dirname, './fixtures/table6.md'),
      'utf-8',
    );
    const resultDoc = await parse(md);
    expect(resultDoc).toEqualDocument(doc);

    // check serializing
    expect(await serialize(doc)).toMatchSnapshot();
    const parsedDoc = await parse(await serialize(doc));
    expect(parsedDoc).toEqualDocument(doc);
  });

  test('table7 missing column cell', async () => {
    const doc = (
      <doc>
        <heading>Table 7</heading>
        <para>| abc | def | | --- | | bar |</para>
      </doc>
    );

    const md = await fs.readFile(
      path.join(__dirname, './fixtures/table7.md'),
      'utf-8',
    );
    const resultDoc = await parse(md);
    expect(resultDoc).toEqualDocument(doc);

    // check serializing
    expect(await serialize(doc)).toMatchSnapshot();
    const parsedDoc = await parse(await serialize(doc));
    expect(parsedDoc).toEqualDocument(doc);
  });

  test('table8 no row', async () => {
    const doc = (
      <doc>
        <heading>Table 8</heading>
        <table>
          <table_row>
            <table_header>
              <para>abc</para>
            </table_header>
            <table_header>
              <para>def</para>
            </table_header>
          </table_row>
        </table>
      </doc>
    );

    const md = await fs.readFile(
      path.join(__dirname, './fixtures/table8.md'),
      'utf-8',
    );
    const resultDoc = await parse(md);
    expect(resultDoc).toEqualDocument(doc);

    // check serializing
    expect(await serialize(doc)).toMatchSnapshot();
    const parsedDoc = await parse(await serialize(doc));
    expect(parsedDoc).toEqualDocument(doc);
  });
});
