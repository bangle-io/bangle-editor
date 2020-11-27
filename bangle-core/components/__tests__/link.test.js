/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import {
  dispatchPasteEvent,
  psx,
  renderTestEditor,
  selectNodeAt,
} from '../../test-helpers/index';
import { toggleMark } from 'tiptap-commands';
import {
  bulletList,
  listItem,
  orderedList,
  bold,
  link,
  doc,
  text,
  paragraph,
} from '../index';
import { queryLinkMarkAtSelection, updateLinkAtSelection } from '../link';
import { SpecRegistry } from 'bangle-core/spec-registry';

const specRegistry = new SpecRegistry([
  doc.spec(),
  text.spec(),
  paragraph.spec(),
  link.spec(),
  bold.spec(),
  bulletList.spec(),
  listItem.spec(),
  orderedList.spec(),
]);

const plugins = [
  paragraph.plugins(),
  link.plugins(),
  bold.plugins(),
  bulletList.plugins(),
  listItem.plugins(),
  orderedList.plugins(),
];

const testEditor = renderTestEditor({ specRegistry, plugins });

test('Creates a link correctly', async () => {
  const { editorView } = testEditor(
    <doc>
      <para>[hello world]</para>
    </doc>,
  );

  toggleMark(editorView.state.schema.marks.link, {
    href: 'https://example.com',
  })(editorView.state, editorView.dispatch);

  expect(editorView.state.doc).toEqualDocument(
    <doc>
      <para>
        <link href="https://example.com">hello world</link>
      </para>
    </doc>,
  );
});

test('Creates a link correctly', async () => {
  const { editorView } = testEditor(
    <doc>
      <para>hello [world]</para>
    </doc>,
  );

  toggleMark(editorView.state.schema.marks.link, {
    href: 'https://example.com',
  })(editorView.state, editorView.dispatch);

  expect(editorView.state.doc).toEqualDocument(
    <doc>
      <para>
        hello <link href="https://example.com">world</link>
      </para>
    </doc>,
  );
});

test('Pastes a link correctly on an empty selection', async () => {
  const { editorView } = testEditor(
    <doc>
      <para>hello world[]</para>
    </doc>,
  );

  dispatchPasteEvent(editorView, { plain: 'https://example.com' });

  expect(editorView.state.doc).toEqualDocument(
    <doc>
      <para>
        hello world
        <link href="https://example.com">https://example.com</link>
      </para>
    </doc>,
  );
});

test('Pastes a link correctly', async () => {
  const { editorView } = testEditor(
    <doc>
      <para>hello [world]</para>
    </doc>,
  );

  dispatchPasteEvent(editorView, { plain: 'https://example.com' });

  expect(editorView.state.doc).toEqualDocument(
    <doc>
      <para>
        hello <link href="https://example.com">world</link>
      </para>
    </doc>,
  );
});

test('Paste a link in a list works', async () => {
  const { editorView } = testEditor(
    <doc>
      <ul>
        <li>
          <para>first</para>
        </li>
        <li>
          <para>first</para>
          <ul>
            <li>
              <para>nested:1</para>
            </li>
            <li>
              <para>[nested:2]</para>
            </li>
          </ul>
        </li>
      </ul>
    </doc>,
  );

  dispatchPasteEvent(editorView, { plain: 'https://example.com' });

  expect(editorView.state.doc).toEqualDocument(
    <doc>
      <ul>
        <li>
          <para>first</para>
        </li>
        <li>
          <para>first</para>
          <ul>
            <li>
              <para>nested:1</para>
            </li>
            <li>
              <para>
                <link href="https://example.com">[nested:2]</link>
              </para>
            </li>
          </ul>
        </li>
      </ul>
    </doc>,
  );
});

describe('remove link', () => {
  test.each([
    [
      <doc>
        <para>
          hello <link href="https://example.com">w[]orld</link>
        </para>
      </doc>,
      <doc>
        <para>hello w[]orld</para>
      </doc>,
    ],
    [
      <doc>
        <para>
          h[]ello <link href="https://example.com">world</link>
        </para>
      </doc>,
      <doc>
        <para>
          h[]ello <link href="https://example.com">world</link>
        </para>
      </doc>,
    ],
    [
      <doc>
        <para>
          hello <link href="https://example.com">[]world</link>
        </para>
      </doc>,
      <doc>
        <para>hello []world</para>
      </doc>,
    ],
    [
      <doc>
        <para>
          hello <link href="https://example.com">world[]</link>
        </para>
      </doc>,
      <doc>
        <para>
          hello <link href="https://example.com">world[]</link>
        </para>
      </doc>,
    ],
    [
      <doc>
        <para>
          hello <link href="https://other.com">o[]ther</link>
          <link href="https://example.com">world</link>
        </para>
      </doc>,
      <doc>
        <para>
          hello o[]ther<link href="https://example.com">world</link>
        </para>
      </doc>,
    ],
    [
      <doc>
        <para>
          hello <link href="https://example.com">world</link>
          <link href="https://other.com">o[]ther</link>
        </para>
      </doc>,
      <doc>
        <para>
          hello <link href="https://example.com">world</link>o[]ther
        </para>
      </doc>,
    ],
  ])('%# Clears link at selection', async (input, expected) => {
    const { editorView } = testEditor(input);

    updateLinkAtSelection()(editorView.state, editorView.dispatch);

    expect(editorView.state).toEqualDocAndSelection(expected);
  });

  test.each([
    [
      <doc>
        <para>
          hello <link href="https://example.com">w[or]ld</link>
        </para>
      </doc>,
      <doc>
        <para>
          hello <link href="https://example.com">w</link>or
          <link href="https://example.com">ld</link>
        </para>
      </doc>,
    ],
    [
      <doc>
        <para>
          hello <link href="https://example.com">[worl]d</link>
        </para>
      </doc>,
      <doc>
        <para>
          hello worl
          <link href="https://example.com">d</link>
        </para>
      </doc>,
    ],
    [
      <doc>
        <para>
          hello <link href="https://example.com">[world]</link>
        </para>
      </doc>,
      <doc>
        <para>hello world</para>
      </doc>,
    ],
    [
      <doc>
        <para>
          h[ello <link href="https://example.com">world]</link>
        </para>
      </doc>,
      <doc>
        <para>hello world</para>
      </doc>,
    ],
    [
      <doc>
        <para>
          h[ello <link href="https://example.com">world</link>
        </para>
        <para>
          hello <link href="https://example.com">world]</link>
        </para>
      </doc>,
      <doc>
        <para>hello world</para>
        <para>hello world</para>
      </doc>,
    ],
  ])('%# Clears link non empty selection', async (input, expected) => {
    const { editorView } = testEditor(input);

    updateLinkAtSelection()(editorView.state, editorView.dispatch);

    expect(editorView.state).toEqualDocAndSelection(expected);
  });

  test.each([
    [
      <doc>
        <para>
          hello{' '}
          <link href="https://example.com">
            world<bold>stro[]ng</bold>
          </link>
        </para>
      </doc>,
      <doc>
        <para>
          hello <link href="https://example.com">world</link>
          <bold>stro[]ng</bold>
        </para>
      </doc>,
    ],
    [
      <doc>
        <para>
          hello{' '}
          <link href="https://example.com">
            world<bold>stro[]ng</bold> with link
          </link>
        </para>
      </doc>,
      <doc>
        <para>
          hello <link href="https://example.com">world</link>
          <bold>stro[]ng</bold>
          <link href="https://example.com"> with link</link>
        </para>
      </doc>,
    ],
  ])(
    '%# When partitioned by other marks clears only the nearest mark',
    async (input, expected) => {
      const { editorView } = testEditor(input);

      updateLinkAtSelection()(editorView.state, editorView.dispatch);

      expect(editorView.state).toEqualDocAndSelection(expected);
    },
  );

  test('when node is selected it should ignore', async () => {
    const { editorView, posLabels } = testEditor(
      <doc>
        <ul>
          <li>
            <para>[]hey</para>
          </li>
        </ul>
        <para>there</para>
      </doc>,
    );

    const nodePosition = posLabels['[]'] - 2;
    selectNodeAt(editorView, nodePosition);
    // check to make sure it is node selection
    expect(editorView.state.selection.node.type.name).toEqual('listItem');

    updateLinkAtSelection()(editorView.state, editorView.dispatch);

    expect(editorView.state.doc).toEqualDocument(
      <doc>
        <ul>
          <li>
            <para>hey</para>
          </li>
        </ul>
        <para>there</para>
      </doc>,
    );
  });
});

describe('Sets link', () => {
  test.each([
    [
      <doc>
        <para>
          hello <link href="https://example.com">w[]orld</link>
        </para>
      </doc>,
      <doc>
        <para>
          hello <link href="https://happy.com">w[]orld</link>
        </para>
      </doc>,
    ],
    [
      <doc>
        <para>
          hello <link href="https://example.com">[]world</link>
        </para>
      </doc>,
      <doc>
        <para>
          hello <link href="https://happy.com">[]world</link>
        </para>
      </doc>,
    ],
    [
      <doc>
        <para>
          hello <link href="https://example.com">world[]</link>
        </para>
      </doc>,
      <doc>
        <para>
          hello <link href="https://example.com">world[]</link>
        </para>
      </doc>,
    ],
  ])('%# sets link at selection', async (input, expected) => {
    const { editorView } = testEditor(input);

    updateLinkAtSelection('https://happy.com')(
      editorView.state,
      editorView.dispatch,
    );

    expect(editorView.state).toEqualDocAndSelection(expected);
  });
});

describe('queryLinkMarkAtSelection', () => {
  test.each([
    [
      0,
      <doc>
        <para>
          <link href="https://example.com">hello world[]</link>
        </para>
      </doc>,
      undefined,
    ],
    [
      1,
      <doc>
        <para>
          <link href="https://example.com">[]hello world</link>
        </para>
      </doc>,
      {
        href: 'https://example.com',
        text: 'hello world',
      },
    ],
    [
      2,
      <doc>
        <para>
          hello <link href="https://example.com">world</link>
          <link href="https://other.com">o[]ther</link>
        </para>
      </doc>,
      { href: 'https://other.com', text: 'other' },
    ],
    [
      'Link is after the position',
      <doc>
        <para>
          before[]<link href="https://example.com">hello world</link>
        </para>
      </doc>,
      { href: 'https://example.com', text: 'hello world' },
    ],
    [
      'Link is before the position',
      <doc>
        <para>
          <link href="https://example.com">hello</link>[]world
        </para>
      </doc>,
      undefined,
    ],
    [
      'Empty selection in between',
      <doc>
        <para>
          hello <link href="https://example.com">w[]orld</link>
        </para>
      </doc>,
      { href: 'https://example.com', text: 'world' },
    ],
    [
      'No link',
      <doc>
        <para>
          h[]ello <link href="https://example.com">world</link>
        </para>
      </doc>,
      undefined,
    ],
    [
      'Multiple links',
      <doc>
        <para>
          hello <link href="https://other.com">o[]ther</link>
          <link href="https://example.com">world</link>
        </para>
      </doc>,
      { href: 'https://other.com', text: 'other' },
    ],
    [
      'Multiple links 2',
      <doc>
        <para>
          hello <link href="https://other.com">other</link>
          <link href="https://example.com">w[]orld</link>
        </para>
      </doc>,
      { href: 'https://example.com', text: 'world' },
    ],
    [
      'When selection spans multiple link, returns the one in from ',
      <doc>
        <para>
          hello <link href="https://other.com">oth[er</link>
          <link href="https://example.com">wor]ld</link>
        </para>
      </doc>,
      { href: 'https://other.com', text: 'other' },
    ],
    [
      'When selection spans multiple link, returns the one in from 2',
      <doc>
        <para>
          hello <link href="https://other.com">oth[er</link>
        </para>
        <para>
          <link href="https://example.com">wor]ld</link>
        </para>
      </doc>,
      { href: 'https://other.com', text: 'other' },
    ],
    [
      'No result when from does not have link',
      <doc>
        <para>
          hell[o <link href="https://other.com">other</link>
        </para>
        <para>
          <link href="https://example.com">wor]ld</link>
        </para>
      </doc>,
      undefined,
    ],

    [
      'Correct result when selection spans the link completely',
      <doc>
        <para>
          hello <link href="https://other.com">[other]</link>
        </para>
      </doc>,
      { href: 'https://other.com', text: 'other' },
    ],

    [
      'Correct result when selection is inside but spans the link partially',
      <doc>
        <para>
          hello <link href="https://other.com">o[ther]</link>
        </para>
      </doc>,
      { href: 'https://other.com', text: 'other' },
    ],

    [
      'Correct result when selection is inside but spans the link partially 2',
      <doc>
        <para>
          hello <link href="https://other.com">[othe]r</link>
        </para>
      </doc>,
      { href: 'https://other.com', text: 'other' },
    ],

    [
      'When multiple marks returns the nearest mark 1',
      <doc>
        <para>
          hello{' '}
          <link href="https://example.com">
            world<bold>stro[]ng</bold>
          </link>
        </para>
      </doc>,
      { href: 'https://example.com', text: 'strong' },
    ],

    [
      'When multiple marks returns the nearest mark 2',
      <doc>
        <para>
          hello{' '}
          <link href="https://example.com">
            wor[]ld<bold>strong</bold>
          </link>
        </para>
      </doc>,
      { href: 'https://example.com', text: 'world' },
    ],

    [
      'When multiple marks returns the nearest from mark 3',
      <doc>
        <para>
          hello{' '}
          <link href="https://example.com">
            [world<bold>strong]</bold>
          </link>
        </para>
      </doc>,
      { href: 'https://example.com', text: 'world' },
    ],
  ])('%#  %s case', async (testId, input, expected) => {
    const { editorView } = testEditor(input);

    expect(queryLinkMarkAtSelection()(editorView.state)).toEqual(expected);
  });
});
