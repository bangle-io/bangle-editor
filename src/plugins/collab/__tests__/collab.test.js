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
import {
  cancelablePromise,
  sleep,
} from '../../../utils/bangle-utils/utils/js-utils';

jest.mock('localforage', () => ({
  config: jest.fn(),
  createInstance: jest.fn(),
}));

jest.setTimeout(1000000);
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
  const case1 = {
    seq1: '💚_____🍌_________________🍌',
    seq2: '💚_____🍌- I am a bullet__🍌',
  };

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

it('hold incoming of a client', async () => {
  // prettier-ignore
  const case1 = {
      seq1: '💚_____🍌_____🍌___🍌',
      seq2: '💚_____🍌- I__🍌___🍌',
    }

  const store = setupStore();
  let seq1Resume = null;
  let shouldStopSeq1 = false;
  let interceptRequests = (path, payload) => {
    if (payload.userId !== 'user-seq1') {
      return;
    }
    if (shouldStopSeq1 && path === 'get_events') {
      console.log('sending never promise to ', payload.userId);
      return new Promise((res) => {
        seq1Resume = res;
      });
    }
  };

  const iter = spinEditors(case1, {
    store,
    managerOpts: { interceptRequests },
  });
  let nextViews = async () => (await iter.next()).value.views;

  shouldStopSeq1 = true;
  // first 🍌
  let { seq1: view1, seq2: view2 } = await nextViews();
  view2.dispatch(
    view2.state.tr.setSelection(
      TextSelection.create(view2.state.doc, view2.state.doc.content.size),
    ),
  );

  view1.dispatch(
    view1.state.tr.setSelection(TextSelection.create(view1.state.doc, 0)),
  );

  // second 🍌 : view1 should be outdated
  ({ seq1: view1, seq2: view2 } = await nextViews());
  expect(view2.state.doc).toEqualDocument(
    doc(p('hello world!'), ul(li(p('I{<>}')))),
  );
  expect(view1.state.doc).toEqualDocument(doc(p('hello world!')));

  seq1Resume();
  shouldStopSeq1 = false;

  // third 🍌 : view1 should be upto date
  ({ seq1: view1, seq2: view2 } = await nextViews());
  expect(view1.state.doc).toEqualDocument(
    doc(p('hello world!'), ul(li(p('I{<>}')))),
  );
  expect(view2.state.doc.toJSON()).toEqual(view1.state.doc.toJSON());
});

it('hold incoming of a client but it still continues to type', async () => {
  // prettier-ignore
  const case1 = {
      seq1: '💚_____🍌__A__🍌___🍌',
      seq2: '💚_____🍌__Z__🍌___🍌',
    }

  const store = setupStore();
  let seq1Resume = null;
  let shouldStopSeq1 = false;
  let interceptRequests = (path, payload) => {
    if (payload.userId !== 'user-seq1') {
      return;
    }
    if (shouldStopSeq1 && path === 'get_events') {
      console.log('sending never promise to ', payload.userId);
      return new Promise((res) => {
        seq1Resume = res;
      });
    }
  };

  const iter = spinEditors(case1, {
    store,
    managerOpts: { interceptRequests },
  });
  let nextViews = async () => (await iter.next()).value.views;

  shouldStopSeq1 = true;
  // first 🍌
  let { seq1: view1, seq2: view2 } = await nextViews();
  view2.dispatch(
    view2.state.tr.setSelection(
      TextSelection.create(view2.state.doc, view2.state.doc.content.size - 1),
    ),
  );

  view1.dispatch(
    view1.state.tr.setSelection(TextSelection.create(view1.state.doc, 1)),
  );

  // second 🍌 : view1 should be out of sync
  ({ seq1: view1, seq2: view2 } = await nextViews());
  // view2 gets the view1's `A` as we have only paused view1's ability to pull
  // in data and not the other way round.
  expect(view2.state.doc).toEqualDocument(doc(p('Ahello world!Z')));
  expect(view1.state.doc).toEqualDocument(doc(p('Ahello world!')));

  seq1Resume();
  shouldStopSeq1 = false;

  // third 🍌 : view1 should be upto date
  ({ seq1: view1, seq2: view2 } = await nextViews());
  expect(view1.state.doc).toEqualDocument(doc(p('Ahello world!Z')));
  expect(view2.state.doc.toJSON()).toEqual(view1.state.doc.toJSON());
});

it.each([
  [
    {
      seq1: '💚_____🍌__AA___🍌_____🍌',
      seq2: '💚_____🍌__ZZZ__🍌_____🍌',
    },
    {
      seq1: doc(p('AAhello world!')),
      seq2: doc(p('hello world!ZZZ')),
    },
    {
      seq1: doc(p('AAhello world!ZZZ')),
      seq2: doc(p('AAhello world!ZZZ')),
    },
  ],

  [
    {
      seq1: '💚_____🍌__AA___🍌_BB__🍌',
      seq2: '💚_____🍌__ZZZ__🍌_YY__🍌',
    },
    {
      seq1: doc(p('AAhello world!')),
      seq2: doc(p('hello world!ZZZ')),
    },
    {
      seq1: doc(p('AABBhello world!ZZZYY')),
      seq2: doc(p('AABBhello world!ZZZYY')),
    },
  ],

  [
    {
      seq1: '💚_____🍌__AA___🍌_↵B↵__🍌',
      seq2: '💚_____🍌__ZZZ__🍌_YYY__🍌',
    },
    {
      seq1: doc(p('AAhello world!')),
      seq2: doc(p('hello world!ZZZ')),
    },
    {
      seq1: doc(p('AA'), p('B'), p('hello world!ZZZYYY')),
      seq2: doc(p('AA'), p('B'), p('hello world!ZZZYYY')),
    },
  ],
])('%# more sync cases', async (seq, secondBananaResult, thirdBananaResult) => {
  const store = setupStore();
  let seq1GetResume = null;
  let seq1PushResume = null;
  let shouldStopSeq1 = false;
  let interceptRequests = (path, payload) => {
    if (payload.userId !== 'user-seq1') {
      return;
    }
    if (shouldStopSeq1 && path === 'get_events') {
      return new Promise((res) => {
        seq1GetResume = res;
      });
    }
    if (shouldStopSeq1 && path === 'push_events') {
      return new Promise((res) => {
        seq1PushResume = res;
      });
    }
  };

  const iter = spinEditors(seq, { store, managerOpts: { interceptRequests } });
  let nextViews = async () => (await iter.next()).value.views;

  shouldStopSeq1 = true;

  // first 🍌: setup selections
  let { seq1: view1, seq2: view2 } = await nextViews();
  view2.dispatch(
    view2.state.tr.setSelection(
      TextSelection.create(view2.state.doc, view2.state.doc.content.size - 1),
    ),
  );

  view1.dispatch(
    view1.state.tr.setSelection(TextSelection.create(view1.state.doc, 1)),
  );

  // second 🍌 :
  ({ seq1: view1, seq2: view2 } = await nextViews());
  // view2 gets the view1's `A` as we have only paused view1's ability to pull
  // in data and not the other way round.
  expect(view1.state.doc).toEqualDocument(secondBananaResult.seq1);
  expect(view2.state.doc).toEqualDocument(secondBananaResult.seq2);

  seq1PushResume();
  seq1GetResume();
  shouldStopSeq1 = false;

  // third 🍌 : views should sync up
  ({ seq1: view1, seq2: view2 } = await nextViews());
  expect(view1.state.doc).toEqualDocument(thirdBananaResult.seq1);
  expect(view2.state.doc).toEqualDocument(thirdBananaResult.seq2);
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

describe('🖤unmounting of editor🖤', () => {
  it('shutting down one editor', async () => {
    const seq = {
      seq1: '💚______aaaaaa______aaaaaa_🖤🍌',
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
        seq1: '💚__hello____🖤_🍌',
        seq2: '💚______ttt__tt🍌',
      },
      [undefined, doc(p('hellottttt{<>}'))],
    ],

    [
      {
        seq1: '💚_____________🖤_🍌',
        seq2: '💚_well 🐑 well___🍌',
        seq3: '___🐑________💚___🍌',
      },
      [undefined, doc(p('well  well{<>}')), doc(p('well  well'))],
    ],

    [
      {
        seq1: '_💚____________🖤____🍌',
        seq2: '🐑💚_well _ well_____🍌',
        seq3: '🐑___________💚__why_🍌',
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
      seq1: '💚_one___🖤______________🍌',
      seq2: '____💚_two__🖤___________🍌',
      seq3: '________💚_three_🖤______🍌',
      seq4: '🐑__________💚___four____🍌',
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
      seq1: '💚_one___🖤____💚_____alive___🍌',
      seq2: '🐑___💚_two__🖤_______________🍌',
      seq3: '🐑_______💚_three_🖤__________🍌',
      seq4: '🐑🐑_________💚___four________🍌',
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

test.each([
  [
    {
      seq1: '💚_🍌_one_____🍌___three____🍌',
      seq2: '💚_🍌___two___🍌____________🍌',
    },
    doc(p('onehello world!two')),
    doc(p('onethreehello world!two')),
  ],
])(
  "Clients recover after server times out the 'get_events' request",
  async (seq, secondBananaResult, thirdBananaResult) => {
    const userWaitTimeout = 500;
    const store = setupStore();
    const iter = spinEditors(seq, {
      store,
      managerOpts: { userWaitTimeout },
    });
    let nextViews = async () => (await iter.next()).value.views;

    // first 🍌
    let { seq1: view1, seq2: view2 } = await nextViews();
    view2.dispatch(
      view2.state.tr.setSelection(
        TextSelection.create(view2.state.doc, view2.state.doc.content.size - 1),
      ),
    );

    view1.dispatch(
      view1.state.tr.setSelection(TextSelection.create(view1.state.doc, 1)),
    );

    await sleep(1.5 * userWaitTimeout);
    // second 🍌 : wait to allow server to disconnect
    ({ seq1: view1, seq2: view2 } = await nextViews());

    await sleep(1.5 * userWaitTimeout);
    // third 🍌 : wait to allow server to disconnect
    ({ seq1: view1, seq2: view2 } = await nextViews());

    expect(view2.state.doc).toEqualDocument(thirdBananaResult);
    expect(view1.state.doc).toEqualDocument(thirdBananaResult);
  },
);
