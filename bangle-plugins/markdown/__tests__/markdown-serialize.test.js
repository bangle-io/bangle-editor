/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx, renderTestEditor } from 'bangle-core/test-helpers/index';

import {
  BulletList,
  Heading,
  Blockquote,
  CodeBlock,
  HardBreak,
  ListItem,
  OrderedList,
  TodoItem,
  TodoList,
  Image,
} from 'bangle-core/nodes';
import { Underline } from 'bangle-core/marks';
import { markdownSerializer } from '../markdown-serializer';
import {
  Bold,
  Code,
  HorizontalRule,
  Italic,
  Link,
  Strike,
} from 'bangle-core/index';
import { markdownParser } from '../markdown-parser';

const extensions = [
  new BulletList(),
  new ListItem(),
  new OrderedList(),
  new HardBreak(),
  new Heading(),
  new Underline(),
  new TodoList(),
  new TodoItem(),
  new Blockquote(),
  new CodeBlock(),
  new HorizontalRule(),
  new Image(),

  // marks
  new Link(),
  new Bold(),
  new Italic(),
  new Strike(),
  new Code(),
  new Underline(),
];

const schemaPromise = renderTestEditor({ extensions })().then((r) => r.schema);
const serialize = async (doc) => {
  const content = doc(await schemaPromise);
  return markdownSerializer(await schemaPromise).serialize(content);
};
const writeToFile = (md) => {
  require('fs').writeFileSync('./my.md', md, 'utf8');
};

const parse = async (md) => markdownParser(await schemaPromise).parse(md);

describe('paragraphs', () => {
  test('paragraph', async () => {
    const doc = (
      <doc>
        <para>hello world</para>
      </doc>
    );

    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`"hello world"`);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('paragraph', async () => {
    const doc = (
      <doc>
        <para>hello world</para>
        <para>bye world</para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "hello world

      bye world"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('paragraph multiple spaces', async () => {
    const doc = (
      <doc>
        <para>{'hello        world'}</para>
        <para>bye world</para>
      </doc>
    );

    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`
      "hello        world

      bye world"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('when parsing paragraph with spaces at start and end, they are removed', async () => {
    const doc = (
      <doc>
        <para>{' hello world '}</para>
        <para>bye world</para>
      </doc>
    );

    const md = await serialize(doc);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>hello world</para>
        <para>bye world</para>
      </doc>,
    );
  });

  test.each(['`', '\\', ...`'"~!@#$%^&*(){}-+=_:;,<.>/?`])(
    'Case %# misc char %s',
    async (str) => {
      const doc = (
        <doc>
          <para>hello world{str}s</para>
        </doc>
      );

      let md = await serialize(doc);
      expect(md).toMatchSnapshot();
      expect(await parse(md)).toEqualDocument(doc);
    },
  );

  test('new line', async () => {
    const doc = (
      <doc>
        <para>hello {'\n'}world</para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toEqual('hello \nworld');
    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>hello{'\n'}world</para>
      </doc>,
    );
  });

  test('multiple new line', async () => {
    const doc = (
      <doc>
        <para>hello {'\n\n\n'}world</para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toEqual('hello \n\n\nworld');
    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>hello</para>
        <para>world</para>
      </doc>,
    );
  });
  // TODO decide what we wanna do with empty
  // paragraph: introduce a br or just ignore them
  test('multiple empty paragraph are omitted', async () => {
    const doc = (
      <doc>
        <para>hello</para>
        <para></para>
        <para></para>
        <para></para>
        <para>world</para>
      </doc>
    );

    const md = await serialize(doc);
    expect(md).toEqual('hello\n\nworld');
    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>hello</para>
        <para>world</para>
      </doc>,
    );
  });
});

describe('ordered list', () => {
  test('renders ordered list', async () => {
    const doc = (
      <doc>
        <ol>
          <li>
            <para>hello</para>
          </li>
        </ol>
      </doc>
    );

    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"1. hello"`);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders ordered list with 2 items', async () => {
    const doc = (
      <doc>
        <ol>
          <li>
            <para>hello</para>
          </li>
          <li>
            <para>hello</para>
          </li>
        </ol>
      </doc>
    );

    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "1. hello

      2. hello"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  // TODO do we want this behaviour
  test('when parsing 2 adjacent ordered list, it fuses them into 1', async () => {
    const doc = (
      <doc>
        <ol>
          <li>
            <para>hello</para>
          </li>
        </ol>
        <ol>
          <li>
            <para>hello</para>
          </li>
        </ol>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "1. hello


      1. hello"
    `);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <ol>
          <li>
            <para>hello</para>
          </li>
          <li>
            <para>hello</para>
          </li>
        </ol>
      </doc>,
    );
  });

  test('renders paragraph between 2 ordered list', async () => {
    const doc = (
      <doc>
        <ol>
          <li>
            <para>hello</para>
          </li>
        </ol>
        <para>world</para>
        <ol>
          <li>
            <para>hello</para>
          </li>
        </ol>
      </doc>
    );

    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "1. hello

      world

      1. hello"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders hr between 2 ordered list', async () => {
    const doc = (
      <doc>
        <ol>
          <li>
            <para>hello</para>
          </li>
        </ol>
        <hr />
        <ol>
          <li>
            <para>hello</para>
          </li>
        </ol>
      </doc>
    );

    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "1. hello

      ---

      1. hello"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders paragraph followed by 2 ordered list', async () => {
    const doc = (
      <doc>
        <para>world</para>
        <ol>
          <li>
            <para>hello</para>
          </li>
        </ol>
        <ol>
          <li>
            <para>hello</para>
          </li>
        </ol>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "world

      1. hello


      1. hello"
    `);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>world</para>
        <ol>
          <li>
            <para>hello</para>
          </li>
          <li>
            <para>hello</para>
          </li>
        </ol>
      </doc>,
    );
  });

  test('renders list with multiple paragraph', async () => {
    const doc = (
      <doc>
        <ol>
          <li>
            <para>text</para>
            <para>other</para>
          </li>
          <li>
            <para>text</para>
            <para>other</para>
          </li>
        </ol>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "1. text

         other

      2. text

         other"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });
});

describe('unordered list', () => {
  test('renders unordered list', async () => {
    const doc = (
      <doc>
        <ul>
          <li>
            <para>hello</para>
          </li>
        </ul>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"- hello"`);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders unordered list with 2 children', async () => {
    const doc = (
      <doc>
        <ul>
          <li>
            <para>hello</para>
          </li>
          <li>
            <para>hello</para>
          </li>
        </ul>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "- hello

      - hello"
    `);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders unordered list nested inside ordered list', async () => {
    const doc = (
      <doc>
        <ol>
          <li>
            <para>parent</para>
            <ul>
              <li>
                <para>hello</para>
              </li>
              <li>
                <para>hello</para>
              </li>
            </ul>
          </li>
        </ol>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "1. parent

         - hello

         - hello"
    `);
    expect(await parse(md)).toEqualDocument(doc);
  });
});

describe('blockquote', () => {
  test('renders blockquote', async () => {
    const doc = (
      <doc>
        <blockquote>
          <para>kj</para>
        </blockquote>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"> kj"`);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('when blockquote with empty para above, parsing removes it', async () => {
    const doc = (
      <doc>
        <para></para>
        <blockquote>
          <para>foobar</para>
        </blockquote>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "
      > foobar"
    `);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <blockquote>
          <para>foobar</para>
        </blockquote>
      </doc>,
    );
  });

  test('renders blockquote with empty para inside', async () => {
    const doc = (
      <doc>
        <para>other paragraph</para>
        <blockquote>
          <para>hello</para>
          <para></para>
        </blockquote>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "other paragraph

      > hello"
    `);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>other paragraph</para>
        <blockquote>
          <para>hello</para>
        </blockquote>
      </doc>,
    );
  });

  test('renders blockquote with two para inside', async () => {
    const doc = (
      <doc>
        <para>other paragraph</para>
        <blockquote>
          <para>hello</para>
          <para>check</para>
        </blockquote>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "other paragraph

      > hello
      >
      > check"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  // TODO is this behaviour desired
  test('renders blockquote with two para and one empty para inside', async () => {
    const doc = (
      <doc>
        <para>other paragraph</para>
        <blockquote>
          <para>hello</para>
          <para></para>
          <para>check</para>
        </blockquote>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "other paragraph

      > hello
      >
      > check"
    `);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>other paragraph</para>
        <blockquote>
          <para>hello</para>
          <para>check</para>
        </blockquote>
      </doc>,
    );
  });

  test('renders blockquote with para below', async () => {
    const doc = (
      <doc>
        <blockquote>
          <para>hello</para>
          <para></para>
        </blockquote>
        <para>other paragraph</para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "> hello

      other paragraph"
    `);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <blockquote>
          <para>hello</para>
        </blockquote>
        <para>other paragraph</para>
      </doc>,
    );
  });

  test('renders blockquote with hardbreak below', async () => {
    const doc = (
      <doc>
        <blockquote>
          <para>
            hello
            <br />
            world
          </para>
        </blockquote>
        <para>other paragraph</para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "> hello\\\\
      > world

      other paragraph"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders blockquote with list', async () => {
    const doc = (
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <blockquote>
          <para>hello</para>
        </blockquote>
        <para>[]</para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "- top

      > hello"
    `);
    expect(await parse(md)).toEqualDocument(
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <blockquote>
          <para>hello</para>
        </blockquote>
      </doc>,
    );
  });
});

describe('codeBlock list', () => {
  test('renders', async () => {
    const doc = (
      <doc>
        <codeBlock>foobar</codeBlock>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "\`\`\`
      foobar
      \`\`\`"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders', async () => {
    const doc = (
      <doc>
        <codeBlock>foobar`something`</codeBlock>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "\`\`\`
      foobar\`something\`
      \`\`\`"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders', async () => {
    const doc = (
      <doc>
        <codeBlock>foobar</codeBlock>
        <para></para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "\`\`\`
      foobar
      \`\`\`"
    `);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <codeBlock>foobar</codeBlock>
      </doc>,
    );
  });

  test('renders with lang identifier', async () => {
    const doc = (
      <doc>
        <codeBlock language="js">foobar</codeBlock>
        <para></para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "\`\`\`js
      foobar
      \`\`\`"
    `);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <codeBlock language="js">foobar</codeBlock>
      </doc>,
    );
  });
});

describe('doc empty', () => {
  test('renders', async () => {
    const doc = (
      <doc>
        <para></para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`""`);

    expect(await parse(md)).toEqualDocument(doc);
  });
});

describe('heading', () => {
  test('renders', async () => {
    const doc = (
      <doc>
        <para>top</para>
        <heading level="1">hello[]</heading>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "top

      # hello"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders', async () => {
    const doc = (
      <doc>
        <para>top</para>
        <heading level="3">hello[]</heading>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "top

      ### hello"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });
});

describe('image', () => {
  const image =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAAH0lEQVQYGWN4/fr1f1FR0f8MDAwQnJOTA+cYGRn9BwDvaAzTLxVZaQAAAABJRU5ErkJggg==';

  test('renders', async () => {
    const doc = (
      <doc>
        <para>
          hello[]
          <image src={image} />
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(
      `"hello![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAAH0lEQVQYGWN4/fr1f1FR0f8MDAwQnJOTA+cYGRn9BwDvaAzTLxVZaQAAAABJRU5ErkJggg==)"`,
    );

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders', async () => {
    const doc = (
      <doc>
        <para>
          hello[]
          <image alt="image" src={image} />
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(
      `"hello![image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAAH0lEQVQYGWN4/fr1f1FR0f8MDAwQnJOTA+cYGRn9BwDvaAzTLxVZaQAAAABJRU5ErkJggg==)"`,
    );

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders', async () => {
    const doc = (
      <doc>
        <para>
          hello[]
          <image label="dot" alt="image" src={image} />
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(
      `"hello![image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAAH0lEQVQYGWN4/fr1f1FR0f8MDAwQnJOTA+cYGRn9BwDvaAzTLxVZaQAAAABJRU5ErkJggg==)"`,
    );

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders', async () => {
    const doc = (
      <doc>
        <para>
          hello
          <image src="image.jpg" title="image" alt="image" />
          []
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"hello![image](image.jpg \\"image\\")"`);

    expect(await parse(md)).toEqualDocument(doc);
  });
});

describe('horizontal rule', () => {
  test('renders', async () => {
    const doc = (
      <doc>
        <hr />
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"---"`);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders', async () => {
    const doc = (
      <doc>
        <hr />
        <para>hello</para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "---

      hello"
    `);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders', async () => {
    const doc = (
      <doc>
        <para>hello</para>
        <hr />
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "hello

      ---"
    `);
  });
});

describe('horizontal rule', () => {
  test('renders', async () => {
    const doc = (
      <doc>
        <hr />
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"---"`);
  });

  test('renders', async () => {
    const doc = (
      <doc>
        <hr />
        <para>hello</para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "---

      hello"
    `);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders', async () => {
    const doc = (
      <doc>
        <para>hello</para>
        <hr />
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "hello

      ---"
    `);
    expect(await parse(md)).toEqualDocument(doc);
  });
});

describe('marks', () => {
  test('link ', async () => {
    const doc = (
      <doc>
        <para>
          hello world
          <link href="https://example.com">https://example.com</link>
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"hello world<https://example.com>"`);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('link with content', async () => {
    const doc = (
      <doc>
        <para>
          hello world
          <link href="https://example.com">example</link>
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(
      `"hello world[example](https://example.com)"`,
    );
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('link with relative url', async () => {
    const doc = (
      <doc>
        <para>
          hello world
          <link href="./example.png">example</link>
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"hello world[example](./example.png)"`);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('link with relative url and asterisk', async () => {
    const doc = (
      <doc>
        <para>
          hello world <link href="./example*.png">example</link>
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toEqual('hello world [example](./example\\*.png)');
    expect(await parse(md)).toEqualDocument(doc);
  });

  // todo fix me
  test('strike link', async () => {
    const doc = (
      <doc>
        <para>
          hello{' '}
          <strike>
            world
            <link href="./example.png">example</link>
          </strike>
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(
      `"hello ~~world~~[~~example~~](./example.png)"`,
    );
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('strike link italic', async () => {
    const doc = (
      <doc>
        <para>
          hello{' '}
          <strike>
            world
            <link href="./example.png">example</link>
            <italic>again</italic>
          </strike>{' '}
          !
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(
      `"hello ~~world~~[~~example~~](./example.png)_~~again~~_ !"`,
    );

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('strike', async () => {
    const doc = (
      <doc>
        <para>
          hello <strike>world</strike>
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`"hello ~~world~~"`);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('test asterix', async () => {
    const doc = (
      <doc>
        <para>*hello* world</para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`"\\\\*hello\\\\* world"`);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('bold', async () => {
    const doc = (
      <doc>
        <para>
          hello
          <bold>world</bold>
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"hello**world**"`);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('bold', async () => {
    const doc = (
      <doc>
        <para>
          hello
          <bold>world </bold>
          <italic>say hello</italic>
          <strike> bye world </strike>
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(
      `"hello**world** _say hello_ ~~bye world~~ "`,
    );

    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>
          hello
          <bold>world</bold> <italic>say hello</italic>{' '}
          <strike>bye world</strike>
        </para>
      </doc>,
    );
  });

  test('italic', async () => {
    const doc = (
      <doc>
        <para>
          hello <italic>world</italic>
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"hello _world_"`);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('italic and bold', async () => {
    const doc = (
      <doc>
        <para>
          hello{' '}
          <bold>
            <italic>world</italic>
          </bold>
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"hello **_world_**"`);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('underline', async () => {
    const doc = (
      <doc>
        <para>
          hello <underline>world</underline>
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`"hello _world_"`);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>
          hello <italic>world</italic>
        </para>
      </doc>,
    );
  });

  test('code', async () => {
    const doc = (
      <doc>
        <para>
          hello <code>world</code>
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`"hello \`world\`"`);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('code escaping', async () => {
    const doc = (
      <doc>
        <para>
          hello <code>worl`d</code>
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toEqual('hello `` worl`d ``');
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('code escaping', async () => {
    const doc = (
      <doc>
        <para>
          hello <code>_world_</code>
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toEqual('hello `_world_`');
    expect(await parse(md)).toEqualDocument(doc);
  });
});

describe('todo list', () => {
  test('renders', async () => {
    const doc = (
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem>
            <para>[]second</para>
          </todoItem>
        </todoList>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

      - [ ] second"
    `);
  });

  test('renders done check list', async () => {
    const doc = (
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem data-done="true">
            <para>[]second</para>
          </todoItem>
        </todoList>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

      - [x] second"
    `);
  });

  test('renders not done check list', async () => {
    const doc = (
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem data-done={false}>
            <para>[]second</para>
          </todoItem>
        </todoList>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

      - [ ] second"
    `);
  });

  test('renders', async () => {
    const doc = (
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem>
            <para>[]second</para>
          </todoItem>
        </todoList>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

      - [ ] second"
    `);
  });

  test('renders with nested ordered list', async () => {
    const doc = (
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <ol>
              <li>
                <para>[]second</para>
              </li>
            </ol>
          </todoItem>
        </todoList>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

        1. second"
    `);
  });

  test('renders with nested ordered list', async () => {
    const doc = (
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <todoList>
              <todoItem>
                <para>[]second</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

        - [ ] second"
    `);
  });

  test('renders with multiple para', async () => {
    const doc = (
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <para>second</para>
          </todoItem>
        </todoList>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

        second"
    `);
  });

  test('br follows', async () => {
    const doc = (
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <para>second</para>
          </todoItem>
        </todoList>
        <para>
          <br />
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

        second"
    `);
  });
});
