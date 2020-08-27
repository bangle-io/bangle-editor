/**
 * @jest-environment jsdom
 */
import '../../../test-helpers/jest-helpers';

import {} from '../../../test-helpers';
import {} from './../../../utils/bangle-utils/nodes';
import { doc, p, ul, li } from './../../../test-helpers/test-builders';
import { TextSelection } from 'prosemirror-state';
import {
  setupStore,
  spinEditors,
  expectToHaveIdenticalElements,
} from '../../../test-helpers/collab-test-helpers';

jest.mock('localforage', () => ({
  config: jest.fn(),
  createInstance: jest.fn(),
}));

const dateNow = Date.now;

afterEach(() => {
  Date.now = dateNow;
});

const emptyDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [],
    },
  ],
};

describe('one client - server', () => {
  it('loads document', async () => {
    expect.hasAssertions();
    const seq = {
      seq1: '💚_🍌',
    };

    let store = setupStore();
    for await (const { states } of spinEditors(seq, { store })) {
      expect(states.seq1).toMatchSnapshot();
      expect(store.getItem).toBeCalledTimes(1);
      expect(store.getItem).toHaveBeenNthCalledWith(1, 'ole');
    }
  });

  it('types correctly and save correctly', async () => {
    expect.hasAssertions();
    // prettier-ignore
    const case1 = {
      seq1: '💚_____🍌↵- I am a bullet__🍌',
    }

    const store = setupStore();
    const iter = spinEditors(case1, { store });
    let nextViews = async () => (await iter.next()).value.views;

    let { seq1: view } = await nextViews();

    view.dispatch(
      view.state.tr.setSelection(
        TextSelection.create(view.state.doc, view.state.doc.content.size),
      ),
    );

    ({ seq1: view } = await nextViews());

    // prettier-ignore
    expect(view.state).toEqualDocAndSelection(
      doc(
          p('hello world!'),
          ul(li(p('I am a bullet{<>}')))
      ),
    );

    expect(store.setItem).lastCalledWith('ole', {
      created: expect.any(Number),
      doc: view.state.doc.toJSON(),
      modified: expect.any(Number),
      title: 'hello world!',
      docName: 'ole',
    });
  });
});

it('changing selection in one client', async () => {
  // prettier-ignore
  const case1 = {
      seq1: '💚_____🍌_________________🍌',
      seq2: '💚_____🍌- I am a bullet__🍌',
    }

  const store = setupStore();
  const iter = spinEditors(case1, { store });
  let nextViews = async () => (await iter.next()).value.views;

  let { seq1: view1, seq2: view2 } = await nextViews();
  view2.dispatch(
    view2.state.tr.setSelection(
      TextSelection.create(view2.state.doc, view2.state.doc.content.size),
    ),
  );
  view1.dispatch(
    view1.state.tr.setSelection(TextSelection.create(view1.state.doc, 0)),
  );

  ({ seq1: view1, seq2: view2 } = await nextViews());

  expect(view1.state.doc).toEqualDocument(
    doc(p('hello world!'), ul(li(p('I am a bullet{<>}')))),
  );
  expect(view2.state.doc.toJSON()).toEqual(view1.state.doc.toJSON());
});

test.each([
  [
    {
      seq1: '💚_🍌',
      seq2: '💚_🍌',
    },
    doc(p()),
  ],
  [
    {
      seq1: '💚_____- I am a bullet__🍌',
      seq2: '💚______________________🍌',
    },
    doc(ul(li(p('I am a bullet')))),
  ],
  [
    {
      seq1: '💚______aaaaaa____aaaaaa_🍌',
      seq2: '💚______b__________b_____🍌',
    },
    doc(p('abaaaaaaabaaaa')),
  ],
])('2 clients Case %#', async (seq, expected) => {
  const store = setupStore(emptyDoc);

  for await (const { views } of spinEditors(seq, { store })) {
    const { seq1: view1, seq2: view2 } = views;
    expect(view1.state.doc).toEqualDocument(expected);
    expect(view2.state.doc.toJSON()).toEqual(view1.state.doc.toJSON());
    expect(store.getItem).toBeCalledTimes(1);
    expect(store.getItem).toHaveBeenNthCalledWith(1, 'ole');
  }
  expect.hasAssertions();
});

test.each([
  [
    {
      seq1: '💚__good after noon everyone ___🍌',
      seq2: '💚______________________________🍌',
      seq3: '💚______________________________🍌',
      seq4: '💚______________________________🍌',
    },
    doc(p('good after noon everyone hello world!')),
  ],
  [
    {
      seq1: '💚__x_🍌',
      seq2: '💚____🍌',
      seq3: '💚____🍌',
      seq4: '💚____🍌',
    },
    doc(p('xhello world!')),
  ],
  [
    {
      seq1: '💚__good after noon everyone _______________________🍌',
      seq2: '💚__________________________________________________🍌',
      seq3: '💚__________________________________________________🍌',
      seq4: '💚_____________________________good night __________🍌',
    },
    doc(p('good after noon everyone good night hello world!')),
  ],
])('4 clients Case %# editor state syncs', async (seq, expected) => {
  for await (const { states } of spinEditors(seq)) {
    expect(states.seq1.doc).toEqualDocument(expected);

    expectToHaveIdenticalElements([
      states.seq1.toJSON(),
      states.seq2.toJSON(),
      states.seq3.toJSON(),
      states.seq4.toJSON(),
    ]);
  }
  expect.hasAssertions();
});

it('four clients correctly call store', async () => {
  expect.hasAssertions();
  const seq = {
    seq1: '💚__x_🍌',
    seq2: '💚____🍌',
    seq3: '💚____🍌',
    seq4: '💚____🍌',
  };

  const store = setupStore();
  for await (const _ of spinEditors(seq, { store })) {
    expect(store.getItem).toBeCalledTimes(1);
    expect(store.getItem).toHaveBeenNthCalledWith(1, 'ole');
  }
});

describe('unmounting of editor', () => {
  it('shutting down one editor', async () => {
    const seq = {
      seq1: '💚______aaaaaa______aaaaaa_✕🍌',
    };

    const store = setupStore(emptyDoc);

    for await (const { views } of spinEditors(seq, { store })) {
      const { seq1: view1 } = views;
      // expect(view1.state.doc).toEqualDocument(expected);
      expect(view1).toBe(undefined);
    }
    expect.hasAssertions();
  });

  test.each([
    [
      {
        seq1: '💚__hello____✕_🍌',
        seq2: '💚______ttt__tt🍌',
      },
      [undefined, doc(p('hellottttt{<>}'))],
    ],

    [
      {
        seq1: '💚_____________✕_🍌',
        seq2: '💚_well _ well___🍌',
        seq3: '____________💚___🍌',
      },
      [undefined, doc(p('well  well{<>}')), doc(p('well  well'))],
    ],

    [
      {
        seq1: '💚_____________✕____🍌',
        seq2: '💚_well _ well______🍌',
        seq3: '____________💚__why_🍌',
      },
      [undefined, doc(p('whywell  well{<>}')), doc(p('why{<>}well  well'))],
    ],
  ])(
    'Case %# editor state syncs',
    async (seq, [expected1, expected2, expected3]) => {
      const store = setupStore(emptyDoc);

      for await (const { views } of spinEditors(seq, { store })) {
        const { seq1: view1, seq2: view2, seq3: view3 } = views;
        expect(view1).toBe(expected1);
        expect(view2.state).toEqualDocAndSelection(expected2);
        expected3 && expect(view3.state).toEqualDocAndSelection(expected3);
      }
      expect.hasAssertions();
    },
  );

  test('multiple closing', async () => {
    const seq = {
      seq1: '💚_one___✕______________🍌',
      seq2: '____💚_two__✕___________🍌',
      seq3: '________💚_three_✕______🍌',
      seq4: '___________💚___four____🍌',
    };
    const store = setupStore(emptyDoc);

    for await (const { views } of spinEditors(seq, { store })) {
      const { seq1: view1, seq2: view2, seq3: view3, seq4: view4 } = views;
      expect(view1).toBe(undefined);
      expect(view2).toBe(undefined);
      expect(view3).toBe(undefined);
      expect(view4.state).toEqualDocAndSelection(doc(p('four{<>}threetwoone')));
    }
    expect.hasAssertions();
  });

  test('reviving of previous', async () => {
    const seq = {
      seq1: '💚_one___✕____💚_____alive___🍌',
      seq2: '🤍___💚_two__✕_______________🍌',
      seq3: '🤍_______💚_three_✕__________🍌',
      seq4: '🤍__________💚___four________🍌',
    };
    const store = setupStore(emptyDoc);

    for await (const { views } of spinEditors(seq, { store })) {
      const { seq1: view1, seq2: view2, seq3: view3, seq4: view4 } = views;
      expect(view1.state).toEqualDocAndSelection(
        doc(p('fouralive{<>}threetwoone')),
      );
      expect(view2).toBe(undefined);
      expect(view3).toBe(undefined);
      expect(view4.state).toEqualDocAndSelection(
        doc(p('fouralive{<>}threetwoone')),
      );
    }
    expect.hasAssertions();
  });
});
