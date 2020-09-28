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

describe('paragraphs', () => {
  test('paragraph', async () => {
    const md = await serialize(
      <doc>
        <para>hello world</para>
      </doc>,
    );
    expect(md).toMatchInlineSnapshot(`"hello world"`);
  });

  test('paragraph', async () => {
    const md = await serialize(
      <doc>
        <para>hello world</para>
        <para>bye world</para>
      </doc>,
    );
    expect(md).toMatchInlineSnapshot(`
      "hello world

      bye world"
    `);
  });

  test('paragraph multiple spaces', async () => {
    const md = await serialize(
      <doc>
        <para>{'hello        world'}</para>
        <para>bye world</para>
      </doc>,
    );
    expect(md).toMatchInlineSnapshot(`
      "hello        world

      bye world"
    `);
  });

  test('paragraph spaces start and end', async () => {
    const md = await serialize(
      <doc>
        <para>{' hello world '}</para>
        <para>bye world</para>
      </doc>,
    );
    expect(md).toMatchInlineSnapshot(`
      " hello world 

      bye world"
    `);
  });

  test.each(['`', '\\', ...`'"~!@#$%^&*(){}-+=_:;,<.>/?`])(
    'Case %# misc char %s',
    async (str) => {
      let md = await serialize(
        <doc>
          <para>hello world{str}s</para>
        </doc>,
      );
      expect(md).toMatchSnapshot();
    },
  );

  test('new line', async () => {
    const md = await serialize(
      <doc>
        <para>hello {'\n'}world</para>
      </doc>,
    );
    expect(md).toEqual('hello \nworld');
  });

  test('new line', async () => {
    const md = await serialize(
      <doc>
        <para>hello {'\n\n\n'}world</para>
      </doc>,
    );
    expect(md).toEqual('hello \n\n\nworld');
  });
  // decide what we wanna do with empty
  // paragraph: introduce a br or just ignore them
  test.todo('empty paragraph');
});

describe('ordered list', () => {
  test('renders ordered list', async () => {
    const md = await serialize(
      <doc>
        <ol>
          <li>
            <para>hello</para>
          </li>
        </ol>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`"1. hello"`);
  });

  test('renders ordered list with 2 items', async () => {
    const md = await serialize(
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

    expect(md).toMatchInlineSnapshot(`
      "1. hello

      2. hello"
    `);
  });

  test('renders 2  ordered list', async () => {
    const md = await serialize(
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
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "1. hello


      1. hello"
    `);
  });

  test('renders paragraph between 2 ordered list', async () => {
    const md = await serialize(
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
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "1. hello

      world

      1. hello"
    `);
  });

  test('renders paragraph followed by 2 ordered list', async () => {
    const md = await serialize(
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
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "world

      1. hello


      1. hello"
    `);
  });

  test('renders list with multiple paragraph', async () => {
    const md = await serialize(
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
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "1. text

         other

      2. text

         other"
    `);
  });
});

describe('unordered list', () => {
  test('renders unordered list', async () => {
    const md = await serialize(
      <doc>
        <ul>
          <li>
            <para>hello</para>
          </li>
        </ul>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`"- hello"`);
  });

  test('renders unordered list with 2 children', async () => {
    const md = await serialize(
      <doc>
        <ul>
          <li>
            <para>hello</para>
          </li>
          <li>
            <para>hello</para>
          </li>
        </ul>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "- hello

      - hello"
    `);
  });

  test('renders unordered list nested inside ordered list', async () => {
    const md = await serialize(
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
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "1. parent

         - hello

         - hello"
    `);
  });
});

describe('blockquote', () => {
  test('renders blockquote', async () => {
    const md = await serialize(
      <doc>
        <blockquote>
          <para>kj</para>
        </blockquote>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`"> kj"`);
  });

  test('renders blockquote with empty para above', async () => {
    const md = await serialize(
      <doc>
        <para>[]</para>
        <blockquote>
          <para>foobar</para>
        </blockquote>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "
      > foobar"
    `);
  });

  test('renders blockquote with empty para inside', async () => {
    const md = await serialize(
      <doc>
        <para>other paragraph</para>
        <blockquote>
          <para>hello</para>
          <para></para>
        </blockquote>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "other paragraph

      > hello"
    `);
  });

  test('renders blockquote with two para inside', async () => {
    const md = await serialize(
      <doc>
        <para>other paragraph</para>
        <blockquote>
          <para>hello</para>
          <para>check</para>
        </blockquote>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "other paragraph

      > hello
      >
      > check"
    `);
  });

  test('renders blockquote with two para and one empty para inside', async () => {
    const md = await serialize(
      <doc>
        <para>other paragraph</para>
        <blockquote>
          <para>hello</para>
          <para></para>
          <para>check</para>
        </blockquote>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "other paragraph

      > hello
      >
      > check"
    `);
  });

  test('renders blockquote with para below', async () => {
    const md = await serialize(
      <doc>
        <blockquote>
          <para>hello</para>
          <para></para>
        </blockquote>
        <para>other paragraph</para>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "> hello

      other paragraph"
    `);
  });

  test('renders blockquote with hardbreak below', async () => {
    const md = await serialize(
      <doc>
        <blockquote>
          <para>
            hello
            <br />
            world
          </para>
        </blockquote>
        <para>other paragraph</para>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "> hello\\\\
      > world

      other paragraph"
    `);
  });

  test('renders blockquote with list', async () => {
    const md = await serialize(
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
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "- top

      > hello"
    `);
  });
});

describe('codeBlock list', () => {
  test('renders', async () => {
    const md = await serialize(
      <doc>
        <para></para>
        <codeBlock>foobar</codeBlock>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "
      \`\`\`
      foobar
      \`\`\`"
    `);
  });

  test('renders', async () => {
    const md = await serialize(
      <doc>
        <para></para>
        <codeBlock>foobar`something`</codeBlock>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "
      \`\`\`
      foobar\`something\`
      \`\`\`"
    `);
  });

  test('renders', async () => {
    const md = await serialize(
      <doc>
        <codeBlock>foobar</codeBlock>
        <para></para>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "\`\`\`
      foobar
      \`\`\`"
    `);
  });
});

describe('doc empty', () => {
  test('renders', async () => {
    const md = await serialize(
      <doc>
        <para></para>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`""`);
  });
});

describe('heading', () => {
  test('renders', async () => {
    const md = await serialize(
      <doc>
        <para>top</para>
        <heading level="1">hello[]</heading>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "top

      # hello"
    `);
  });

  test('renders', async () => {
    const md = await serialize(
      <doc>
        <para>top</para>
        <heading level="3">hello[]</heading>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "top

      ### hello"
    `);
  });
});

describe('image', () => {
  const image =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAAH0lEQVQYGWN4/fr1f1FR0f8MDAwQnJOTA+cYGRn9BwDvaAzTLxVZaQAAAABJRU5ErkJggg==';

  test('renders', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello[]
          <image src={image} />
        </para>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(
      `"hello![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAAH0lEQVQYGWN4/fr1f1FR0f8MDAwQnJOTA+cYGRn9BwDvaAzTLxVZaQAAAABJRU5ErkJggg==)"`,
    );
  });

  test('renders', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello[]
          <image alt="image" src={image} />
        </para>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(
      `"hello![image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAAH0lEQVQYGWN4/fr1f1FR0f8MDAwQnJOTA+cYGRn9BwDvaAzTLxVZaQAAAABJRU5ErkJggg==)"`,
    );
  });

  test('renders', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello[]
          <image label="dot" alt="image" src={image} />
        </para>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(
      `"hello![image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAAH0lEQVQYGWN4/fr1f1FR0f8MDAwQnJOTA+cYGRn9BwDvaAzTLxVZaQAAAABJRU5ErkJggg==)"`,
    );
  });

  test('renders', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello
          <image src="image.jpg" title="image" alt="image" />
          []
        </para>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`"hello![image](image.jpg \\"image\\")"`);
  });
});

describe('todo list', () => {
  test('renders', async () => {
    const md = await serialize(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem>
            <para>[]second</para>
          </todoItem>
        </todoList>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

      - [ ] second"
    `);
  });

  test('renders with nested ordered list', async () => {
    const md = await serialize(
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
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

        1. second"
    `);
  });

  test('renders with nested ordered list', async () => {
    const md = await serialize(
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
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

        - [ ] second"
    `);
  });

  test('renders with multiple para', async () => {
    const md = await serialize(
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <para>second</para>
          </todoItem>
        </todoList>
      </doc>,
    );
    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

        second"
    `);
  });

  test('br follows', async () => {
    const md = await serialize(
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
      </doc>,
    );
    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

        second"
    `);
  });
});

describe('horizontal rule', () => {
  test('renders', async () => {
    const md = await serialize(
      <doc>
        <hr />
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`"---"`);
  });

  test('renders', async () => {
    const md = await serialize(
      <doc>
        <hr />
        <para>hello</para>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "---

      hello"
    `);
  });

  test('renders', async () => {
    const md = await serialize(
      <doc>
        <para>hello</para>
        <hr />
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "hello

      ---"
    `);
  });
});

describe('horizontal rule', () => {
  test('renders', async () => {
    const md = await serialize(
      <doc>
        <hr />
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`"---"`);
  });

  test('renders', async () => {
    const md = await serialize(
      <doc>
        <hr />
        <para>hello</para>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "---

      hello"
    `);
  });

  test('renders', async () => {
    const md = await serialize(
      <doc>
        <para>hello</para>
        <hr />
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`
      "hello

      ---"
    `);
  });
});

describe('marks', () => {
  test('link ', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello world
          <link href="https://example.com">https://example.com</link>
        </para>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`"hello world<https://example.com>"`);
  });

  test('link with content', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello world
          <link href="https://example.com">example</link>
        </para>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(
      `"hello world[example](https://example.com)"`,
    );
  });

  test('link with relative url', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello world
          <link href="./example.png">example</link>
        </para>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`"hello world[example](./example.png)"`);
  });

  test('link with relative url and asterisk', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello world
          <link href="./example*.png">example</link>
        </para>
      </doc>,
    );

    expect(md).toEqual('hello world[example](./example\\*.png)');
  });

  test('strike link', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello{' '}
          <strike>
            world
            <link href="./example.png">example</link>
          </strike>
        </para>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(
      `"hello ~~world~~[~~example~~](./example.png)"`,
    );
  });

  test('strike link italic', async () => {
    const md = await serialize(
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
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(
      `"hello ~~world~~[~~example~~](./example.png)_~~again~~_ !"`,
    );
  });

  test('bold', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello
          <bold>world</bold>
        </para>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`"hello**world**"`);
  });

  test('bold', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello
          <bold>world </bold>
          <italic>say hello</italic>
          <strike> bye world </strike>
        </para>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(
      `"hello**world** _say hello_ ~~bye world~~ "`,
    );
  });

  test('italic', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello <italic>world</italic>
        </para>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`"hello _world_"`);
  });

  test('italic and bold', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello{' '}
          <bold>
            <italic>world</italic>
          </bold>
        </para>
      </doc>,
    );

    expect(md).toMatchInlineSnapshot(`"hello **_world_**"`);
  });

  test('strike', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello <strike>world</strike>
        </para>
      </doc>,
    );
    expect(md).toMatchInlineSnapshot(`"hello ~~world~~"`);
  });

  test('strike', async () => {
    const md = await serialize(
      <doc>
        <para>*hello* world</para>
      </doc>,
    );
    expect(md).toMatchInlineSnapshot(`"\\\\*hello\\\\* world"`);
  });

  test('underline', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello <underline>world</underline>
        </para>
      </doc>,
    );
    expect(md).toMatchInlineSnapshot(`"hello <ins>world</ins>"`);
  });

  test('code', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello <code>world</code>
        </para>
      </doc>,
    );
    expect(md).toMatchInlineSnapshot(`"hello \`world\`"`);
  });

  test('code escaping', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello <code>worl`d</code>
        </para>
      </doc>,
    );
    expect(md).toEqual('hello `` worl`d ``');
  });

  test('code escaping', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello <code>_world_</code>
        </para>
      </doc>,
    );
    expect(md).toEqual('hello `_world_`');
  });
});
