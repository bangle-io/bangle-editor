import { Editor as PMEditor } from 'bangle-core/editor';
import {
  OrderedList,
  BulletList,
  ListItem,
  Heading,
  HardBreak,
  TodoList,
  TodoItem,
} from 'bangle-core/nodes';
import { Manager } from './server/manager';
import { uuid } from 'bangle-core/utils/js-utils';
import { Disk } from '../persistence/disk';
import {
  renderTestEditor,
  sendKeyToPm,
  sleep,
  typeChar,
} from 'bangle-core/test-helpers';
import { CollabEditor } from './CollabClient';

const START = '💚';
const END = '🖤';
const PAUSE_FOR_ASSERTIONS = '🍌';
const NOOP = '_';
// useful for balancing lengths of seq, as all sequences should be equal and a presence of
// emoji in one sequence can mess up the alignment as emojis are large and take more space than a
// regular string
const EMOJI_NOOP = '🐑';
const ENTER = '↵';

export function setupDb(doc) {
  return {
    getItem: jest.fn(async () => {
      return {
        uid: 'ole',
        doc: doc || {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'hello world!',
                },
              ],
            },
          ],
        },
        created: 0,
      };
    }),
    setItem: jest.fn(async () => {}),
  };
}

export function setup(db = setupDb(), { managerOpts }) {
  const extensions = (uid = uuid()) => [
    new OrderedList(),
    new BulletList(),
    new ListItem(),
    new Heading(),
    new HardBreak(),
    new TodoList(),
    new TodoItem(),
  ];

  let disk = new Disk({ db, saveEvery: 50 });

  return {
    manager: new Manager(createOneOffSchema(extensions()), {
      disk,
      ...managerOpts,
    }),
    editors: [],
    getEditor: function (id) {
      return this.editors.find((e) => e[0] === id)?.[1];
    },
    unmount: async function (id) {
      const match = this.getEditor(id);
      if (!match) {
        throw new Error(id + ' editor not found');
      }
      match.unmount();
      this.editors = this.editors.filter((e) => e[0] !== id);
    },
    createEditor: async function (id, docName) {
      const editor = await renderTestEditor(
        {
          manager: this.manager,
          extensions: extensions(id),
          content: docName,
          collabClientId: id,
        },
        'data-test-' + id,
        CollabEditor,
      )();
      this.editors.push([id, editor]);
      return editor;
    },
  };
}

export async function* spinEditors(
  testCase,
  {
    store = setupDb(),
    docName = 'ole',
    typeInterval = 1,
    columnGapInterval = 10,
    snoozeInterval = 10,
    managerOpts = {},
  } = {},
) {
  // chars of this type must either exist in the entire column
  const columnOnlyChars = [PAUSE_FOR_ASSERTIONS];

  const base = setup(store, {
    managerOpts,
  });
  const iter = iterateCases(base, testCase, { typeInterval, columnOnlyChars });

  for (let cur = await iter.next(); !cur.done; cur = await iter.next()) {
    const { type, ...props } = cur.value;
    if (type === 'column_char') {
      if (props.char === PAUSE_FOR_ASSERTIONS) {
        yield {
          type: 'paused',
          ...props,
        };

        continue;
      }

      throw new Error('Unknown column char: ' + props.char);
    }

    if (type === 'char') {
      const { editorName, char, resolveAtEndOfColumn, view } = props;
      if (char === START) {
        await base.createEditor(editorName, docName);
        continue;
      }

      if (char === END) {
        resolveAtEndOfColumn(base.unmount(editorName));
        continue;
      }

      if (char === NOOP || char === EMOJI_NOOP) {
        resolveAtEndOfColumn(sleep(columnGapInterval));
        continue;
      }

      if (char === ENTER) {
        sendKeyToPm(view, 'Enter');
        continue;
      }

      if (char === '⌫') {
        sendKeyToPm(view, 'Backspace');
        continue;
      }

      if (char === '-' || char === ' ') {
        typeChar(view, char);
        continue;
      }

      if (/^[a-zA-Z]$/.test(char)) {
        typeChar(view, char);
        continue;
      }

      throw new Error('Unknown char: ' + char);
    }

    throw new Error('unknown value type', type);
  }
}

async function* iterateCases(
  base,
  testCase,
  { typeInterval, columnOnlyChars },
) {
  const allStrokes = Object.entries(testCase).map(([editorName, chars]) => [
    editorName,
    [...chars], // important to use `...` as emoji characters don't work well with direct access like string[position]
  ]);
  const size = allStrokes[0][1].length;

  allStrokes.forEach((r, i) => {
    if (r[1].length !== size) {
      console.log(r[1], r[1].length, size);
      throw new Error('lengths of sequences must be same');
    }
  });

  for (let column = 0; column < size; column++) {
    const currentStrokes = allStrokes.map(([editorName, chars]) => [
      editorName,
      chars[column],
    ]);

    const columnChar = currentStrokes.find((r) =>
      columnOnlyChars.includes(r[1]),
    )?.[1];

    if (columnChar) {
      if (currentStrokes.some((r) => columnChar !== r[1])) {
        throw new Error(`The column ${column} must all be ${columnChar} `);
      }

      //  call with all the chars in a column
      yield {
        type: 'column_char',
        column,
        char: columnChar,
        views: Object.fromEntries(
          currentStrokes.map(([editorName]) => [
            editorName,
            base.getEditor(editorName)?.editor.view,
          ]),
        ),
        states: Object.fromEntries(
          currentStrokes.map(([editorName]) => [
            editorName,
            base.getEditor(editorName)?.editor.view?.state,
          ]),
        ),
      };

      // skip running each individual char as it was a column char
      continue;
    }

    let promises = [];
    //  each individual char
    for (const [editorName, char] of currentStrokes) {
      yield {
        type: 'char',
        editorName,
        char: char,
        column,
        view: base.getEditor(editorName)?.editor.view,
        editor: base.getEditor(editorName)?.editor,
        resolveAtEndOfColumn: (promise) => {
          promises.push(promise);
        },
      };
      await sleep(typeInterval);
    }
    await Promise.all(promises);
  }
}

function createOneOffSchema(extensions) {
  const dummyEditor = new PMEditor(document.createElement('div'), {
    extensions,
    renderNodeView: () => {},
    destroyNodeView: () => {},
    onInit: () => {},
    manualViewCreate: true,
  });
  const schema = dummyEditor.schema;
  dummyEditor.destroy();
  return schema;
}

// does a deep equality on all its members
// ie.e. a == b == c == d ... so on
export function expectToHaveIdenticalElements(array) {
  if (array.length === 0) {
    throw new Error('Empty array');
  }
  const first = array[0];
  for (let item of array) {
    expect(item).toEqual(first);
  }
}
