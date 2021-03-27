/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { SpecRegistry } from '@bangle.dev/core/index';
import {
  bulletList,
  listItem,
  orderedList,
  hardBreak,
  underline,
  codeBlock,
  doc,
  strike,
  text,
  paragraph,
  heading,
} from '@bangle.dev/core/components';
import {
  psx,
  renderTestEditor,
  createPSXFragment,
} from '@bangle.dev/core/test-helpers/index';
import { toggleHeadingCollapse, uncollapseAllHeadings } from '../heading';

const specRegistry = new SpecRegistry([
  doc.spec(),
  text.spec(),
  paragraph.spec(),
  bulletList.spec(),
  listItem.spec(),
  orderedList.spec(),
  hardBreak.spec(),
  heading.spec(),
  codeBlock.spec(),
  underline.spec(),
  strike.spec(),
]);

const plugins = [
  paragraph.plugins(),
  bulletList.plugins(),
  listItem.plugins(),
  orderedList.plugins(),
  hardBreak.plugins(),
  heading.plugins(),
  codeBlock.plugins(),
  underline.plugins(),
  strike.plugins(),
];

const testEditor = renderTestEditor({
  specRegistry,
  plugins,
});

const t = createPSXFragment(specRegistry.schema, [
  <para>hello</para>,
  <para>abcd</para>,
  <heading
    level={3}
    collapseContent={createPSXFragment(specRegistry.schema, [
      <para>world</para>,
      <para>earth</para>,
    ]).toJSON()}
  >
    inner heading
  </heading>,
  <heading level={3}>bye</heading>,
]).toJSON();

// The following test cases should avoid nested
// collapsing as they are shared between multiple tests
const baseTestCases = [
  [
    'higher level below',

    <doc>
      <heading level={3}>a[]b</heading>
      <para>hello</para>
      <para>abcd</para>
      <heading level={2}>bye</heading>
    </doc>,
    <doc>
      <heading
        level={3}
        collapseContent={createPSXFragment(specRegistry.schema, [
          <para>hello</para>,
          <para>abcd</para>,
        ]).toJSON()}
      >
        a[]b
      </heading>
      <heading level={2}>bye</heading>
    </doc>,
  ],

  [
    'higher level below: selection variant 1',
    <doc>
      <heading level={3}>
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry.[]
      </heading>
      <para>hello</para>
      <para>
        Lorem Ipsum has been the industry's standard dummy text ever since the
        1500s, when an unknown printer took a galley of type and scrambled it to
        make a type specimen book. It has survived not only five centuries, but
        also the leap into electronic typesetting, remaining essentially
        unchanged.
      </para>
      <heading level={2}>bye</heading>
    </doc>,
    <doc>
      <heading
        level={3}
        collapseContent={createPSXFragment(specRegistry.schema, [
          <para>hello</para>,
          <para>
            Lorem Ipsum has been the industry's standard dummy text ever since
            the 1500s, when an unknown printer took a galley of type and
            scrambled it to make a type specimen book. It has survived not only
            five centuries, but also the leap into electronic typesetting,
            remaining essentially unchanged.
          </para>,
        ]).toJSON()}
      >
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry.[]
      </heading>
      <heading level={2}>bye</heading>
    </doc>,
  ],

  [
    'higher level below: selection variant 2',
    <doc>
      <heading level={3}>
        []Lorem Ipsum is simply dummy text of the printing and typesetting
        industry.
      </heading>
      <para>hello</para>
      <para>
        Lorem Ipsum has been the industry's standard dummy text ever since the
        1500s.
      </para>
      <heading level={2}>bye</heading>
    </doc>,
    <doc>
      <heading
        level={3}
        collapseContent={createPSXFragment(specRegistry.schema, [
          <para>hello</para>,
          <para>
            Lorem Ipsum has been the industry's standard dummy text ever since
            the 1500s.
          </para>,
        ]).toJSON()}
      >
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry.
      </heading>
      <heading level={2}>bye</heading>
    </doc>,
  ],

  [
    'same level below',
    <doc>
      <heading level={3}>a[]b</heading>
      <para>hello</para>
      <para>abcd</para>
      <heading level={3}>bye</heading>
    </doc>,
    <doc>
      <heading
        level={3}
        collapseContent={createPSXFragment(specRegistry.schema, [
          <para>hello</para>,
          <para>abcd</para>,
        ]).toJSON()}
      >
        a[]b
      </heading>
      <heading level={3}>bye</heading>
    </doc>,
  ],

  [
    'lower level below',

    <doc>
      <heading level={3}>a[]b</heading>
      <para>12</para>
      <para>abcd</para>
      <heading level={4}>bye</heading>
      <para>1</para>
      <para>2</para>
    </doc>,

    <doc>
      <heading
        level={3}
        collapseContent={createPSXFragment(specRegistry.schema, [
          <para>12</para>,
          <para>abcd</para>,
          <heading level={4}>bye</heading>,
          <para>1</para>,
          <para>2</para>,
        ]).toJSON()}
      >
        a[]b
      </heading>
    </doc>,
  ],

  [
    'multi level: low level then high level below',
    <doc>
      <heading level={3}>a[]b</heading>
      <para>12</para>
      <heading level={4}>bye</heading>
      <para>1</para>
      <heading level={2}>bye</heading>
      <para>2</para>
    </doc>,

    <doc>
      <heading
        level={3}
        collapseContent={createPSXFragment(specRegistry.schema, [
          <para>12</para>,
          <heading level={4}>bye</heading>,
          <para>1</para>,
        ]).toJSON()}
      >
        a[]b
      </heading>
      <heading level={2}>bye</heading>
      <para>2</para>
    </doc>,
  ],

  [
    'lower level  and code block',
    <doc>
      <heading level={3}>a[]b</heading>
      <para>12</para>
      <heading level={4}>bye</heading>
      <para>1</para>
      <codeBlock>foobar</codeBlock>
      <para>2</para>
    </doc>,

    <doc>
      <heading
        level={3}
        collapseContent={createPSXFragment(specRegistry.schema, [
          <para>12</para>,
          <heading level={4}>bye</heading>,
          <para>1</para>,
          <codeBlock>foobar</codeBlock>,
          <para>2</para>,
        ]).toJSON()}
      >
        a[]b
      </heading>
    </doc>,
  ],

  [
    'same level below and code block',
    <doc>
      <para>a</para>
      <heading level={2}>hi</heading>
      <para>1</para>
      <heading level={3}>a[]b</heading>
      <codeBlock>foobar</codeBlock>
      <para>2</para>
      <heading level={3}>bye</heading>
    </doc>,

    <doc>
      <para>a</para>
      <heading level={2}>hi</heading>
      <para>1</para>
      <heading
        level={3}
        collapseContent={createPSXFragment(specRegistry.schema, [
          <codeBlock>foobar</codeBlock>,
          <para>2</para>,
        ]).toJSON()}
      >
        a[]b
      </heading>
      <heading level={3}>bye</heading>
    </doc>,
  ],

  [
    'lower level below and list',
    <doc>
      <para>a</para>
      <heading level={4}>hi</heading>
      <para>1</para>
      <heading level={3}>a[]b</heading>
      <ul>
        <li>
          <para>first</para>
        </li>
        <li>
          <para>
            <strike>
              <br />
            </strike>
            <strike>- I </strike>
          </para>
        </li>
        <li>
          <para>last</para>
        </li>
      </ul>
      <codeBlock>foobar</codeBlock>
      <para>2</para>
      <heading level={4}>bye</heading>
    </doc>,

    <doc>
      <para>a</para>
      <heading level={4}>hi</heading>
      <para>1</para>
      <heading
        level={3}
        collapseContent={createPSXFragment(specRegistry.schema, [
          <ul>
            <li>
              <para>first</para>
            </li>
            <li>
              <para>
                <strike>
                  <br />
                </strike>
                <strike>- I </strike>
              </para>
            </li>
            <li>
              <para>last</para>
            </li>
          </ul>,
          <codeBlock>foobar</codeBlock>,
          <para>2</para>,
          <heading level={4}>bye</heading>,
        ]).toJSON()}
      >
        a[]b
      </heading>
    </doc>,
  ],

  [
    'lower level below and list: multi depth variant 1',
    <doc>
      <para>a</para>
      <heading level={4}>hi</heading>
      <para>1</para>
      <heading level={3}>
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. []b
      </heading>
      <ul>
        <li>
          <para>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</para>
        </li>
        <li>
          <para>
            Mauris ullamcorper turpis laoreet felis luctus consectetur.
          </para>
        </li>
        <li>
          <para>
            Fusce viverra nisl ut augue laoreet, sed pellentesque ex congue.
          </para>
          <ul>
            <li>
              <para>
                Integer vel odio tempus, malesuada nunc ac, auctor nunc.
              </para>
            </li>
            <li>
              <para>
                Proin hendrerit nunc sed mi ultrices, in mollis massa sagittis.
              </para>
            </li>
          </ul>
        </li>
        <li>
          <para>Morbi laoreet risus eget libero tempus fringilla.</para>
        </li>
      </ul>
      <para>Ut a turpis mattis tellus imperdiet dapibus non quis dolor.</para>
      <heading level={4}>bye</heading>
    </doc>,

    <doc>
      <para>a</para>
      <heading level={4}>hi</heading>
      <para>1</para>
      <heading
        level={3}
        collapseContent={createPSXFragment(specRegistry.schema, [
          <ul>
            <li>
              <para>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </para>
            </li>
            <li>
              <para>
                Mauris ullamcorper turpis laoreet felis luctus consectetur.
              </para>
            </li>
            <li>
              <para>
                Fusce viverra nisl ut augue laoreet, sed pellentesque ex congue.
              </para>
              <ul>
                <li>
                  <para>
                    Integer vel odio tempus, malesuada nunc ac, auctor nunc.
                  </para>
                </li>
                <li>
                  <para>
                    Proin hendrerit nunc sed mi ultrices, in mollis massa
                    sagittis.
                  </para>
                </li>
              </ul>
            </li>
            <li>
              <para>Morbi laoreet risus eget libero tempus fringilla.</para>
            </li>
          </ul>,
          <para>
            Ut a turpis mattis tellus imperdiet dapibus non quis dolor.
          </para>,
          <heading level={4}>bye</heading>,
        ]).toJSON()}
      >
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. []b
      </heading>
    </doc>,
  ],

  [
    'higher level below and list: multi depth variant 1',
    <doc>
      <para>a</para>
      <heading level={4}>hi</heading>
      <para>1</para>
      <heading level={3}>
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. []b
      </heading>
      <ul>
        <li>
          <para>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</para>
        </li>
        <li>
          <para>
            Mauris ullamcorper turpis laoreet felis luctus consectetur.
          </para>
        </li>
        <li>
          <para>
            Fusce viverra nisl ut augue laoreet, sed pellentesque ex congue.
          </para>
          <ul>
            <li>
              <para>
                Integer vel odio tempus, malesuada nunc ac, auctor nunc.
              </para>
            </li>
            <li>
              <para>
                Proin hendrerit nunc sed mi ultrices, in mollis massa sagittis.
              </para>
            </li>
          </ul>
        </li>
        <li>
          <para>Morbi laoreet risus eget libero tempus fringilla.</para>
        </li>
      </ul>
      <para>Ut a turpis mattis tellus imperdiet dapibus non quis dolor.</para>
      <heading level={2}>bye</heading>
      <ul>
        <li>
          <para>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</para>
        </li>
      </ul>
    </doc>,

    <doc>
      <para>a</para>
      <heading level={4}>hi</heading>
      <para>1</para>
      <heading
        level={3}
        collapseContent={createPSXFragment(specRegistry.schema, [
          <ul>
            <li>
              <para>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </para>
            </li>
            <li>
              <para>
                Mauris ullamcorper turpis laoreet felis luctus consectetur.
              </para>
            </li>
            <li>
              <para>
                Fusce viverra nisl ut augue laoreet, sed pellentesque ex congue.
              </para>
              <ul>
                <li>
                  <para>
                    Integer vel odio tempus, malesuada nunc ac, auctor nunc.
                  </para>
                </li>
                <li>
                  <para>
                    Proin hendrerit nunc sed mi ultrices, in mollis massa
                    sagittis.
                  </para>
                </li>
              </ul>
            </li>
            <li>
              <para>Morbi laoreet risus eget libero tempus fringilla.</para>
            </li>
          </ul>,
          <para>
            Ut a turpis mattis tellus imperdiet dapibus non quis dolor.
          </para>,
        ]).toJSON()}
      >
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. []b
      </heading>
      <heading level={2}>bye</heading>
      <ul>
        <li>
          <para>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</para>
        </li>
      </ul>
    </doc>,
  ],
];

test.each([
  ...baseTestCases,
  [
    'nested collapsed: variant 1',

    <doc>
      <heading level={2}>a[]b</heading>
      <para>hello</para>
      <para>abcd</para>
      <heading
        level={3}
        collapseContent={createPSXFragment(specRegistry.schema, [
          <para>world</para>,
          <para>earth</para>,
        ]).toJSON()}
      >
        inner heading
      </heading>
      <heading level={3}>bye</heading>
    </doc>,

    <doc>
      <heading
        level={2}
        collapseContent={createPSXFragment(specRegistry.schema, [
          <para>hello</para>,
          <para>abcd</para>,
          <heading
            level={3}
            collapseContent={createPSXFragment(specRegistry.schema, [
              <para>world</para>,
              <para>earth</para>,
            ]).toJSON()}
          >
            inner heading
          </heading>,
          <heading level={3}>bye</heading>,
        ]).toJSON()}
      >
        a[]b
      </heading>
    </doc>,
  ],

  [
    'nested collapsed: variant 2',

    <doc>
      <heading level={2}>a[]b</heading>
      <para>hello</para>
      <para>abcd</para>
      <heading
        level={3}
        collapseContent={createPSXFragment(specRegistry.schema, [
          <para>world</para>,
          <para>earth</para>,
        ]).toJSON()}
      >
        inner heading
      </heading>
      <para>what</para>
      <heading level={1}>bye</heading>
      <heading level={2}>final</heading>
      <para>end</para>
    </doc>,

    <doc>
      <heading
        level={2}
        collapseContent={createPSXFragment(specRegistry.schema, [
          <para>hello</para>,
          <para>abcd</para>,
          <heading
            level={3}
            collapseContent={createPSXFragment(specRegistry.schema, [
              <para>world</para>,
              <para>earth</para>,
            ]).toJSON()}
          >
            inner heading
          </heading>,
          <para>what</para>,
        ]).toJSON()}
      >
        a[]b
      </heading>
      <heading level={1}>bye</heading>
      <heading level={2}>final</heading>
      <para>end</para>
    </doc>,
  ],
])('%# collapse toggling %s', async (testName, orignal, expected) => {
  const { view } = testEditor(orignal);

  toggleHeadingCollapse()(view.state, view.dispatch);

  expect(view.state).toEqualDocAndSelection(expected);

  toggleHeadingCollapse()(view.state, view.dispatch);

  expect(view.state).toEqualDocAndSelection(orignal);
});

test.each([...baseTestCases])(
  '%# uncollapse all headings base tests: %s',
  async (testName, orignal, expected) => {
    const { view } = testEditor(orignal);

    toggleHeadingCollapse()(view.state, view.dispatch);

    expect(view.state).toEqualDocAndSelection(expected);

    uncollapseAllHeadings()(view.state, view.dispatch);

    expect(view.state).toEqualDocAndSelection(orignal);
  },
);

// Note there is another test for this in trailing-node package
test.each([
  [
    'nested collapsed: depth 1',
    <doc>
      <heading
        level={2}
        collapseContent={createPSXFragment(specRegistry.schema, [
          <para>hello</para>,
          <para>abcd</para>,
          <heading
            level={3}
            collapseContent={createPSXFragment(specRegistry.schema, [
              <para>world</para>,
              <para>earth</para>,
            ]).toJSON()}
          >
            inner heading
          </heading>,
          <heading level={3}>bye</heading>,
        ]).toJSON()}
      >
        a[]b
      </heading>
    </doc>,
    <doc>
      <heading level={2}>a[]b</heading>
      <para>hello</para>
      <para>abcd</para>
      <heading level={3}>inner heading</heading>
      <para>world</para>
      <para>earth</para>
      <heading level={3}>bye</heading>
    </doc>,
  ],

  [
    'nested collapsed: depth 4',

    <doc>
      <heading
        level={2}
        collapseContent={createPSXFragment(specRegistry.schema, [
          <para>hello</para>,
          <para>abcd</para>,
          <heading
            level={3}
            collapseContent={createPSXFragment(specRegistry.schema, [
              <para>world</para>,
              <para>earth</para>,
            ]).toJSON()}
          >
            inner heading
          </heading>,
          <para>what</para>,

          <heading
            level={2}
            collapseContent={createPSXFragment(specRegistry.schema, [
              <para>mercury</para>,
              <para>venus</para>,
              <heading
                level={4}
                collapseContent={createPSXFragment(specRegistry.schema, [
                  <para>mars</para>,
                  <para>jupiter</para>,
                ]).toJSON()}
              >
                earth
              </heading>,
              <para>saturn</para>,
            ]).toJSON()}
          >
            sun
          </heading>,
        ]).toJSON()}
      >
        start[]
      </heading>
      <heading level={1}>bye</heading>
      <heading level={2}>final</heading>
      <para>end</para>
    </doc>,

    <doc>
      <heading level={2}>start[]</heading>
      <para>hello</para>
      <para>abcd</para>
      <heading level={3}>inner heading</heading>
      <para>world</para>
      <para>earth</para>
      <para>what</para>
      <heading level={2}>sun</heading>
      <para>mercury</para>
      <para>venus</para>
      <heading level={4}>earth</heading>
      <para>mars</para>
      <para>jupiter</para>
      <para>saturn</para>
      <heading level={1}>bye</heading>
      <heading level={2}>final</heading>
      <para>end</para>
    </doc>,
  ],
])('uncollapse all headings', async (testName, original, expected) => {
  const { view } = testEditor(original);
  uncollapseAllHeadings()(view.state, view.dispatch);
  expect(view.state).toEqualDocAndSelection(expected);
});

test('uncollapse all headings nested', async () => {
  const original = (
    <doc>
      <heading
        level={2}
        collapseContent={createPSXFragment(specRegistry.schema, [
          <para>one</para>,
          <heading level={4}>two</heading>,
          <para>three</para>,
          <codeBlock>four</codeBlock>,
          <heading
            level={3}
            collapseContent={createPSXFragment(specRegistry.schema, [
              <para>five</para>,
              <heading level={4}>heading-c</heading>,
              <para>seven</para>,
              <codeBlock>eight</codeBlock>,
            ]).toJSON()}
          >
            heading-b
          </heading>,
        ]).toJSON()}
      >
        heading-a[]
      </heading>
      <heading
        level={3}
        collapseContent={createPSXFragment(specRegistry.schema, [
          <para>nine</para>,
          <para>ten</para>,
          <heading level={4}>eleven</heading>,
          <para>twelve</para>,
        ]).toJSON()}
      >
        heading-d
      </heading>
      <para>end</para>
    </doc>
  );

  const result = (
    <doc>
      <heading level={2}>heading-a[]</heading>
      <para>one</para>
      <heading level={4}>two</heading>
      <para>three</para>
      <codeBlock>four</codeBlock>
      <heading level={3}>heading-b</heading>
      <para>five</para>
      <heading level={4}>heading-c</heading>
      <para>seven</para>
      <codeBlock>eight</codeBlock>
      <heading level={3}>heading-d</heading>
      <para>nine</para>
      <para>ten</para>
      <heading level={4}>eleven</heading>
      <para>twelve</para>
      <para>end</para>
    </doc>
  );

  const { view } = testEditor(original);
  uncollapseAllHeadings()(view.state, view.dispatch);

  expect(view.state).toEqualDocAndSelection(result);
});
