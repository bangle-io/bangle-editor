/**
 * @jest-environment jsdom
 */

import '../../../../../src/test-helpers/jest-helpers';

import {
  doc,
  ul,
  li,
  p,
  ol,
  br,
  h1,
  codeBlock,
  underline,
} from '../../../../../src/test-helpers/test-builders';
import { renderTestEditor } from '../../../../../src/test-helpers/render-test-editor';
import { applyCommand } from '../../../../../src/test-helpers/commands-helpers';

import { OrderedList } from '../ordered-list';
import { BulletList } from '../bullet-list';
import { ListItem } from '../list-item/list-item';
import {
  sendKeyToPm,
  typeText,
} from '../../../../../src/test-helpers/keyboard';
import { GapCursorSelection } from '../../../../../src/utils/bangle-utils/gap-cursor';
import { Underline } from '../../../../../src/utils/bangle-utils/marks';

import { CodeBlock } from '../code-block';
import { Heading } from '../heading';
import { HardBreak } from '../hard-break';

import {
  enterKeyCommand,
  splitListItem,
  toggleList,
  backspaceKeyCommand,
} from '../list-item/commands';

const extensions = [
  new BulletList(),
  new ListItem(),
  new OrderedList(),
  new HardBreak(),
  new Heading(),
  new Underline(),
];
const testEditor = renderTestEditor({ extensions });

describe('Command: toggleList', () => {
  let updateDoc, editorView;

  beforeEach(async () => {
    ({ editorView, updateDoc } = await testEditor());
  });

  test('toggles correctly', async () => {
    updateDoc(doc(p('foobar{<>}')));
    // because togglelist requires a view to work
    // we are not using the applyCommand helper
    toggleList(editorView.state.schema.nodes['bullet_list'])(
      editorView.state,
      editorView.dispatch,
      editorView,
    );

    expect(editorView.state.doc).toEqualDocument(doc(ul(li(p('foobar')))));
  });
});

describe('Command: backspaceKeyCommand', () => {
  const extensions = [
    new BulletList(),
    new ListItem(),
    new OrderedList(),
    new HardBreak(),
    new CodeBlock(),
  ];
  const testEditor = renderTestEditor({ extensions });
  let updateDoc,
    editorView,
    cmd = applyCommand(backspaceKeyCommand());

  beforeEach(async () => {
    ({ editorView, updateDoc } = await testEditor());
  });

  test('toggles correctly', async () => {
    updateDoc(doc(ol(li(p('{<>}text')))));

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      doc(p('{<>}text')),
    );
  });

  test('toggles correctly with multi paragraphs', async () => {
    updateDoc(doc(ol(li(p('{<>}text'), p('other')))));

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      doc(p('{<>}text'), p('other')),
    );
  });
});

describe('Command: enterKeyCommand', () => {
  let updateDoc,
    editorView,
    cmd = applyCommand(enterKeyCommand());

  beforeEach(async () => {
    ({ editorView, updateDoc } = await testEditor());
  });

  test('creates a new list when pressed enter at end', async () => {
    updateDoc(doc(ul(li(p('foobar{<>}')))));

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      doc(ul(li(p('foobar')), li(p('{<>}')))),
    );
  });

  test('splits list', async () => {
    updateDoc(doc(ul(li(p('foo{<>}bar')))));

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      doc(ul(li(p('foo')), li(p('bar')))),
    );
  });

  test('Handles if two items in list', async () => {
    updateDoc(doc(ul(li(p('first')), li(p('second{<>}third')))));

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      doc(ul(li(p('first')), li(p('second')), li(p('third')))),
    );
  });

  test('outdents to an empty para if enter on empty non-nested list', async () => {
    updateDoc(doc(ul(li(p('first')), li(p('{<>}'))), p('end')));

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      doc(ul(li(p('first'))), p('{<>}'), p('end')),
    );
  });

  test('outdents to first list if enter on empty 2nd nest list', async () => {
    updateDoc(doc(ul(li(p('first'), ul(li(p('{<>}')))))));

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      doc(ul(li(p('first')), li(p('{<>}')))),
    );
  });

  test('preserves the type of parent list (ul) if enter on empty 2nd nest ol list', async () => {
    updateDoc(doc(ul(li(p('first'), ol(li(p('{<>}')))))));

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      doc(ul(li(p('first')), li(p('{<>}')))),
    );
  });
});

describe('Markdown shortcuts Input rules', () => {
  test('-<Space> should create list', async () => {
    const { editorView } = await testEditor(doc(p('first'), p('{<>}')));

    typeText(editorView, '- kj');
    expect(editorView.state).toEqualDocAndSelection(
      doc(p('first'), ul(li(p('kj{<>}')))),
    );
  });
  test('*<Space> should create list', async () => {
    const { editorView } = await testEditor(doc(p('first'), p('{<>}')));

    typeText(editorView, '* kj');
    expect(editorView.state).toEqualDocAndSelection(
      doc(p('first'), ul(li(p('kj{<>}')))),
    );
  });
  test.skip('*<Space> merge list if a list is already at bottom', async () => {
    const { editorView } = await testEditor(
      doc(p('{<>}'), ul(li(p('second')))),
    );

    typeText(editorView, '* k');
    expect(editorView.state).toEqualDocAndSelection(
      doc(ul(li(p('k')), li(p('second')))),
    );
  });

  test('*<Space> merge list if near a list', async () => {
    const { editorView } = await testEditor(doc(ul(li(p('first'))), p('{<>}')));

    typeText(editorView, '* kj');
    expect(editorView.state).toEqualDocAndSelection(
      doc(ul(li(p('first')), li(p('kj')))),
    );
  });

  it.skip('should convert to a bullet list item after shift+enter ', async () => {
    const { editorView, sel } = await testEditor(doc(p('test', br(), '{<>}')));
    typeText(editorView, '* ', sel);

    expect(editorView.state.doc).toEqualDocument(doc(p('test'), ul(li(p()))));
  });

  it('should be not be possible to convert a code to a list item', async () => {
    const extensions = [
      new BulletList(),
      new ListItem(),
      new OrderedList(),
      new HardBreak(),
      new CodeBlock(),
    ];
    const testEditor = renderTestEditor({ extensions });

    const { editorView, sel } = await testEditor(doc(codeBlock()('{<>}')));
    typeText(editorView, '* ', sel);
    expect(editorView.state.doc).toEqualDocument(doc(codeBlock()('* ')));
  });

  test.skip('1.<space> should create ordered list', async () => {
    const { editorView } = await testEditor(doc(p('first{<>}')));
    sendKeyToPm(editorView, 'Enter');
    typeText(editorView, '1. k');

    expect(editorView.state).toEqualDocAndSelection(
      doc(p('first'), ol(li(p('k{<>}')))),
    );
  });
  it('should not convert "2. " to a ordered list item', async () => {
    const { editorView, sel } = await testEditor(doc(p('{<>}')));

    typeText(editorView, '2. ', sel);
    expect(editorView.state.doc).toEqualDocument(doc(p('2. ')));
  });

  it('should not convert "2. " after shift+enter to a ordered list item', async () => {
    const { editorView, sel } = await testEditor(doc(p('test', br(), '{<>}')));
    typeText(editorView, '2. ', sel);
    expect(editorView.state.doc).toEqualDocument(doc(p('test', br(), '2. ')));
  });
});

test('Typing works', async () => {
  const { editor } = await testEditor(doc(ul(li(p('foo{<>}bar')))));

  typeText(editor.view, 'hello');

  expect(editor.state).toEqualDocAndSelection(
    doc(ul(li(p('foohello{<>}bar')))),
  );
});

test('Pressing Enter', async () => {
  const { editor } = await testEditor(doc(ul(li(p('foo{<>}bar')))));

  sendKeyToPm(editor.view, 'Enter');

  expect(editor.state).toEqualDocAndSelection(
    doc(ul(li(p('foo')), li(p('{<>}bar')))),
  );
});

describe('Pressing Tab', () => {
  test('first list has no effect', async () => {
    const { editor } = await testEditor(doc(ul(li(p('foo{<>}bar')))));

    sendKeyToPm(editor.view, 'Tab');

    expect(editor.state).toEqualDocAndSelection(doc(ul(li(p('foo{<>}bar')))));
  });
  test('second list nests', async () => {
    const { editor } = await testEditor(
      doc(ul(li(p('first')), li(p('{<>}second')))),
    );

    sendKeyToPm(editor.view, 'Tab');

    expect(editor.state).toEqualDocAndSelection(
      doc(ul(li(p('first'), ul(li(p('{<>}second')))))),
    );
  });
});

describe('Pressing Backspace', () => {
  const check = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Backspace');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
  };

  it('should outdent a first level list item to paragraph', async () => {
    await check(
      doc(ol(li(p('text')), li(p('{<>}')))),
      doc(ol(li(p('text'))), p('{<>}')),
    );
  });

  it('should outdent a first level list item to paragraph, with content', async () => {
    await check(
      doc(ol(li(p('text')), li(p('{<>}second text')))),
      doc(ol(li(p('text'))), p('{<>}second text')),
    );
  });

  it('should outdent a second level list item to first level', async () => {
    await check(
      doc(ol(li(p('text'), ol(li(p('{<>}')))))),
      doc(ol(li(p('text')), li(p('{<>}')))),
    );
  });

  it('should outdent a second level list item to first level, with content', async () => {
    await check(
      doc(ol(li(p('text'), ol(li(p('{<>}subtext')))))),
      doc(ol(li(p('text')), li(p('{<>}subtext')))),
    );
  });

  it('should move paragraph content back to previous (nested) list item', async () => {
    await check(
      doc(ol(li(p('text'), ol(li(p('text'))))), p('{<>}after')),
      doc(ol(li(p('text'), ol(li(p('text{<>}after')))))),
    );
  });

  it('keeps nodes same level as backspaced list item together in same list', async () => {
    await check(
      doc(
        ol(li(p('{<>}A'), ol(li(p('B')))), li(p('C'))),

        p('after'),
      ),
      doc(
        p('{<>}A'),
        ol(li(p('B')), li(p('C'))),

        p('after'),
      ),
    );
  });

  it('merges two single-level lists when the middle paragraph is backspaced', async () => {
    await check(
      doc(
        ol(li(p('A')), li(p('B'))),

        p('{<>}middle'),

        ol(li(p('C')), li(p('D'))),
      ),
      doc(ol(li(p('A')), li(p('B{<>}middle')), li(p('C')), li(p('D')))),
    );
  });

  it('merges two double-level lists when the middle paragraph is backspaced', async () => {
    await check(
      doc(
        ol(li(p('A'), ol(li(p('B')))), li(p('C'))),

        p('{<>}middle'),

        ol(li(p('D'), ol(li(p('E')))), li(p('F'))),
      ),
      doc(
        ol(
          li(p('A'), ol(li(p('B')))),
          li(p('C{<>}middle')),
          li(p('D'), ol(li(p('E')))),
          li(p('F')),
        ),
      ),
    );
  });

  it('moves directly to previous list item if it was empty', async () => {
    await check(
      doc(
        ol(li(p('nice')), li(p('')), li(p('{<>}text'))),

        p('after'),
      ),
      doc(
        ol(li(p('nice')), li(p('{<>}text'))),

        p('after'),
      ),
    );
  });

  it('moves directly to previous list item if it was empty, but with two paragraphs', async () => {
    await check(
      doc(
        ol(li(p('nice')), li(p('')), li(p('{<>}text'), p('double'))),

        p('after'),
      ),
      doc(
        ol(li(p('nice')), li(p('{<>}text'), p('double'))),

        p('after'),
      ),
    );
  });

  it('backspaces paragraphs within a list item rather than the item itself', async () => {
    await check(
      doc(
        ol(li(p('')), li(p('nice'), p('{<>}two'))),

        p('after'),
      ),
      doc(
        ol(li(p('')), li(p('nice{<>}two'))),

        p('after'),
      ),
    );
  });

  it('backspaces line breaks correctly within list items, with content after', async () => {
    await check(
      doc(
        ol(li(p('')), li(p('nice'), p('two', br(), '{<>}three'))),

        p('after'),
      ),
      doc(
        ol(li(p('')), li(p('nice'), p('two{<>}three'))),

        p('after'),
      ),
    );
  });

  it('backspaces line breaks correctly within list items, with content before', async () => {
    await check(
      doc(
        ol(li(p('')), li(p('nice'), p('two', br(), br(), '{<>}'))),

        p('after'),
      ),
      doc(
        ol(li(p('')), li(p('nice'), p('two', br(), '{<>}'))),

        p('after'),
      ),
    );
  });
});

// TODO fix these edge cases
describe('Pressing Forward delete', () => {
  const check = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Delete');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
  };

  it.skip('Should handle empty paragraph', async () => {
    // prettier-ignore
    await check(
      doc(
        ol(
          li(p('text')), 
          li(p('{<>}'))
        ), 
        p('')
      ),
      doc(
        ol(
          li(p('text')), 
          li(p('{<>}'))
        ), 
      ),
    );
  });

  it.skip('Should handle non-empty paragraph', async () => {
    // prettier-ignore
    await check(
      doc(
        ol(
          li(p('text')), 
          li(p('{<>}'))
        ), 
        p('hello')
      ),
      doc(
        ol(
          li(p('text')), 
          li(p('{<>}hello'))
        ), 
      ),
    );
  });
});

describe('Pressing Shift-Tab', () => {
  const check = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Shift-Tab');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
  };

  it('should outdent the list', async () => {
    await check(
      doc(ol(li(p('One'), ul(li(p('Two{<>}')))))),
      doc(ol(li(p('One')), li(p('Two{<>}')))),
    );
  });
});

describe('Pressing Shift-Ctrl-8', () => {
  const check = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Shift-Ctrl-8');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
  };

  it('should indent the list', async () => {
    await check(doc(p('One{<>}')), doc(ul(li(p('One')))));
  });

  it('should outdent the list', async () => {
    await check(doc(ul(li(p('One{<>}')))), doc(p('One{<>}')));
  });

  it('works with nested list', async () => {
    // prettier-ignore
    await check(
      doc(
        ul(
          li(
            p('One{<>}'), 
            ul(
              li(p('nested:1')),
            )
          )
        ),
      ), 
      doc(
        p('One{<>}'),
        ul(li(p('nested:1')))
      ), 
    );
  });

  // TODO this is a bug
  it.skip('works with nested list with empty content', async () => {
    // prettier-ignore
    await check(
      doc(
        ul(
          li(
            p('One{<>}'), 
            ul(
              li(p('')),
            )
          )
        ),
      ), 
      doc(
        p('One{<>}'),
        ul(li(p('')))
      ), 
  );
  });
});

describe('Pressing Shift-Ctrl-9', () => {
  const check = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Shift-Ctrl-9');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
  };

  it('should outdent the list', async () => {
    await check(doc(p('One{<>}')), doc(ol(li(p('One')))));
  });
});

describe('Press Alt-Up / Down to move list', () => {
  const check = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Alt-Up');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
    sendKeyToPm(editorView, 'Alt-Down');
    expect(editorView.state).toEqualDocAndSelection(beforeDoc);
  };

  it('if item above exists and selection is at end', async () => {
    await check(
      doc(ul(li(p('first')), li(p('second{<>}')))),
      doc(ul(li(p('second{<>}')), li(p('first')))),
    );
  });

  it('if item above exists and selection is in between', async () => {
    await check(
      doc(ul(li(p('first')), li(p('sec{<>}ond')))),
      doc(ul(li(p('sec{<>}ond')), li(p('first')))),
    );
  });

  it('if item above exists and selection is at start', async () => {
    await check(
      doc(ul(li(p('first')), li(p('{<>}second')))),
      doc(ul(li(p('{<>}second')), li(p('first')))),
    );
  });

  it('if  first item is very big', async () => {
    await check(
      doc(ul(li(p('first is really big')), li(p('{<>}second')))),
      doc(ul(li(p('{<>}second')), li(p('first is really big')))),
    );
  });
  it('if second item is very big', async () => {
    await check(
      doc(ul(li(p('f')), li(p('{<>}second is really big')))),
      doc(ul(li(p('{<>}second is really big')), li(p('f')))),
    );
  });
  it('if second item is empty', async () => {
    await check(
      doc(ul(li(p('first')), li(p('{<>}')))),
      doc(ul(li(p('{<>}')), li(p('first')))),
    );
  });

  it('if first item is empty', async () => {
    await check(
      doc(ul(li(p('')), li(p('sec{<>}ond')))),
      doc(ul(li(p('sec{<>}ond')), li(p('')))),
    );
  });

  it('works for nested ul list', async () => {
    // prettier-ignore
    await check(
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1')),
            li(p('nested:2{<>}'))
          ))
        )
      ),
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:2{<>}')),
            li(p('nested:1')),
          ))
        )
      ),
    );
  });
});

describe('Move up for first item in their level', () => {
  const checkUp = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Alt-Up');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
  };

  it('apex item is outdented', async () => {
    // prettier-ignore
    await checkUp(
      doc(
        ul(
          li(p('first{<>}')),
          li(p('second'))
        )
      ),
      doc(
        p('first'),
        ul(
          li(p('second'))
        )
      ),
    );
  });

  it('simple', async () => {
    // prettier-ignore
    await checkUp(
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1{<>}')),
            li(p('nested:2'))
          ))
        )
      ),
      doc(
        ul(
          li(p('first')),
          li(p('nested:1')),
          li(p('second'), ul(
            li(p('nested:2'))
          ))
        )
      ),
    );
  });

  it('any nested children also move along', async () => {
    // prettier-ignore
    await checkUp(
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1{<>}'), ul(
              li(p('nested-child:1'))
            )),
            li(p('nested:2'))
          ))
        )
      ),
      doc(
        ul(
          li(p('first')),
          li(p('nested:1'), ul(
            li(p('nested-child:1'))
          )),
          li(p('second'), ul(
            li(p('nested:2'))
          ))
        )
      ),
    );
  });

  it('deeply nested list works', async () => {
    // prettier-ignore
    await checkUp(
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1'), ul(
              li(p('nested-child:1{<>}'))
            )),
            li(p('nested:2'))
          ))
        )
      ),
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested-child:1')),
            li(p('nested:1')),
            li(p('nested:2'))
          ))
        )
      ),
    );
  });

  it('encounters uncle', async () => {
    // prettier-ignore
    await checkUp(
      doc(
        ul(
          li(p('uncle')),
          li(p('second'), ul(
            li(p('nested:1{<>}')),
            li(p('nested:2'))
          )),
        )
      ),
      doc(
        ul(
          li(p('uncle')),
          li(p('nested:1')),
          li(p('second'), ul(
            li(p('nested:2'))
          )),
        )
      ),
    );
  });

  it('encounters uncle with children', async () => {
    // prettier-ignore
    await checkUp(
      doc(
        ul(
          li(p('uncle'), ul(
            li(p('uncles child:1')),
            li(p('uncles child:2')),
          )),
          li(p('first'), ul(
            li(p('nested:1{<>}')),
            li(p('nested:2')),
          )),
        )
      ),
      doc(
        ul(
          li(p('uncle'), ul(
            li(p('uncles child:1')),
            li(p('uncles child:2')),
          )),
          li(p('nested:1')),
          li(p('first'), ul(
            li(p('nested:2')),
          )),
        )
      ),
    );
  });
});

describe('Move down for last item in their level', () => {
  const checkDown = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Alt-Down');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
  };

  it('rock bottom item is outdented', async () => {
    // prettier-ignore
    await checkDown(
      doc(
        ul(
          li(p('first')),
          li(p('second{<>}'))
        )
      ),
      doc(
        ul(
          li(p('first'))
        ),
        p('second'),
      ),
    );
  });

  it('simple', async () => {
    // prettier-ignore
    await checkDown(
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1')),
            li(p('nested:2{<>}'))
          ))
        )
      ),
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1'))
          )),
          li(p('nested:2')),
        )
      ),
    );
  });

  it('any nested children also move along', async () => {
    // prettier-ignore
    await checkDown(
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1')),
            li(p('nested:2{<>}'), ul(
              li(p('nested-child:1'))
            )),
          ))
        )
      ),
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1'))
          )),
          li(p('nested:2'), ul(
            li(p('nested-child:1'))
          )),
        )
      ),
    );
  });

  it('deeply nested list works', async () => {
    // prettier-ignore
    await checkDown(
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1')),
            li(p('nested:2'), ul(
              li(p('nested-child:1{<>}')),
            )),
          ))
        )
      ),
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1')),
            li(p('nested:2')),
            li(p('nested-child:1')),
          ))
        )
      ),
    );
  });

  it('encounters uncle', async () => {
    // prettier-ignore
    await checkDown(
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1')),
            li(p('nested:2{<>}'))
          )),
          li(p('uncle')),
        )
      ),
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1'))
          )),
          li(p('uncle')),
          li(p('nested:2')),
        )
      ),
    );
  });

  it('encounters uncle with children', async () => {
    // prettier-ignore
    await checkDown(
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1')),
            li(p('nested:2{<>}')),
          )),
          li(p('uncle'), ul(
            li(p('uncles child:1')),
            li(p('uncles child:2')),
          )),
        )
      ),
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1')),
          )),
          li(p('uncle'), ul(
            li(p('uncles child:1')),
            li(p('uncles child:2')),
          )),
          li(p('nested:2')),
        )
      ),
    );
  });
  it('encounters uncles with children', async () => {
    // prettier-ignore
    await checkDown(
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1')),
            li(p('nested:2{<>}')),
          )),
          li(p('uncle'), ul(
            li(p('uncles child:1')),
            li(p('uncles child:2')),
          )),
          li(p('uncle2'), ul(
            li(p('uncles2 child:1')),
            li(p('uncles2 child:2')),
          )),
        )
      ),
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1')),
          )),
          li(p('uncle'), ul(
            li(p('uncles child:1')),
            li(p('uncles child:2')),
          )),
          li(p('nested:2')),
          li(p('uncle2'), ul(
            li(p('uncles2 child:1')),
            li(p('uncles2 child:2')),
          )),
        )
      ),
    );
  });

  it('outdents to list', async () => {
    // prettier-ignore
    await checkDown(
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1')),
          )),
          li(p('thir{<>}d')),
        ),
      ),
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1')),
          )),
        ),
        p('third'),
      ),
    );
  });

  it('outdents to list if other elements below', async () => {
    // prettier-ignore
    await checkDown(
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1')),
          )),
          li(p('third{<>}')),
        ),
        ol(
          li(p('1'))
        )
      ),
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1')),
          )),
        ),
        p('third'),
        ol(
          li(p('1'))
        )
      ),
    );
  });
});

describe('Press Alt-Down to move list', () => {
  const check = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Alt-Down');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
  };

  it('outdents single item', async () => {
    await check(doc(ul(li(p('first{<>}')))), doc(p('first{<>}')));
  });

  it('works if running on last item', async () => {
    await check(
      doc(ul(li(p('first')), li(p('second{<>}')))),
      doc(ul(li(p('first'))), p('second{<>}')),
    );
  });

  it('if item above exists and selection is in between', async () => {
    await check(
      doc(ul(li(p('sec{<>}ond')), li(p('first')))),
      doc(ul(li(p('first')), li(p('sec{<>}ond')))),
    );
  });

  it('if item below exists and selection is at end', async () => {
    await check(
      doc(ul(li(p('second{<>}')), li(p('first')))),
      doc(ul(li(p('first')), li(p('second{<>}')))),
    );
  });

  it('if item below exists and selection is in between', async () => {
    await check(
      doc(ul(li(p('sec{<>}ond')), li(p('first')))),
      doc(ul(li(p('first')), li(p('sec{<>}ond')))),
    );
  });

  it('if item below exists and selection is at start', async () => {
    await check(
      doc(ul(li(p('{<>}second')), li(p('first')))),
      doc(ul(li(p('first')), li(p('{<>}second')))),
    );
  });

  it('if  last item is very big', async () => {
    await check(
      doc(ul(li(p('{<>}second')), li(p('first is really big')))),
      doc(ul(li(p('first is really big')), li(p('{<>}second')))),
    );
  });
  it('if first item is very big', async () => {
    await check(
      doc(ul(li(p('{<>}second is really big')), li(p('f')))),
      doc(ul(li(p('f')), li(p('{<>}second is really big')))),
    );
  });
  it('if first item is empty', async () => {
    await check(
      doc(ul(li(p('{<>}')), li(p('first')))),
      doc(ul(li(p('first')), li(p('{<>}')))),
    );
  });

  it('works for nested ul list', async () => {
    // prettier-ignore
    await check(
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1{<>}')),
            li(p('nested:2'))
          ))
        )
      ),
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:2')),
            li(p('nested:1{<>}')),
          ))
        )
      ),
    );
  });

  it('works for 2x nested ul list', async () => {
    // prettier-ignore
    await check(
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1')),
            li(p('nested:2'), ul(
              li(p('nested:1:1{<>}')),
              li(p('nested:2:2')),
            ))
          ))
        )
      ),
      doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1')),
            li(p('nested:2'), ul(
              li(p('nested:2:2')),
              li(p('nested:1:1{<>}')),
            ))
          ))
        )
      ),
    );
  });
});

describe('Meta-c on empty selections', () => {
  it('should work', async () => {
    document.execCommand = jest.fn(() => {});

    const { editorView } = await testEditor(
      doc(ul(li(p('magic')), li(p('k{<>}j'), ul(li(p('foobar')))))),
    );
    sendKeyToPm(editorView, 'Cmd-c');
    expect(editorView.state).toEqualDocAndSelection(
      doc(ul(li(p('magic')), li(p('k{<>}j'), ul(li(p('foobar')))))),
    );
    expect(document.execCommand).toBeCalledTimes(1);
    expect(document.execCommand).toBeCalledWith('copy');
  });
});

describe('Meta-x on empty selections', () => {
  test('should cut a document', async () => {
    document.execCommand = jest.fn(() => {});

    const { editorView } = await testEditor(
      doc(ul(li(p('magic')), li(p('fooba{<>}r')))),
    );
    sendKeyToPm(editorView, 'Cmd-x');
    expect(editorView.state.selection).toMatchInlineSnapshot(`
        Object {
          "anchor": 10,
          "type": "node",
        }
      `);
    expect(editorView.state.doc).toEqualDocument(
      doc(ul(li(p('magic')), li(p('foobar')))),
    );
    expect(document.execCommand).toBeCalledTimes(1);
  });
});

describe('Toggling the list', () => {
  const toggleOrderedList = (editorView) =>
    toggleList(editorView.state.schema.nodes['ordered_list'])(
      editorView.state,
      editorView.dispatch,
      editorView,
    );
  const toggleBulletList = (editorView) =>
    toggleList(editorView.state.schema.nodes['bullet_list'])(
      editorView.state,
      editorView.dispatch,
      editorView,
    );
  it('should allow toggling between normal text and ordered list', async () => {
    const { editorView } = await testEditor(doc(p('t{a}ex{b}t')));

    toggleOrderedList(editorView);
    expect(editorView.state.doc).toEqualDocument(doc(ol(li(p('text')))));
    toggleOrderedList(editorView);
    expect(editorView.state.doc).toEqualDocument(doc(p('text')));
  });

  it('should allow toggling between normal text and bullet list', async () => {
    const { editorView } = await testEditor(doc(p('t{<}ex{>}t')));

    toggleBulletList(editorView);
    expect(editorView.state.doc).toEqualDocument(doc(ul(li(p('text')))));
    toggleBulletList(editorView);
    expect(editorView.state.doc).toEqualDocument(doc(p('text')));
  });

  it('should allow toggling between ordered and bullet list', async () => {
    const { editorView } = await testEditor(doc(ol(li(p('t{<}ex{>}t')))));

    toggleBulletList(editorView);
    expect(editorView.state.doc).toEqualDocument(doc(ul(li(p('text')))));
    toggleBulletList(editorView);
    expect(editorView.state.doc).toEqualDocument(doc(p('text')));
  });

  describe('toggling a list', () => {
    it("shouldn't affect text selection", async () => {
      const { editorView } = await testEditor(doc(p('hello{<>}')));

      toggleBulletList(editorView);
      // If the text is not selected, pressing enter will
      // create a new paragraph. If it is selected the
      // 'hello' text will be removed
      sendKeyToPm(editorView, 'Enter');

      expect(editorView.state.doc).toEqualDocument(
        doc(ul(li(p('hello')), li(p('')))),
      );
    });
  });

  describe('untoggling a list', () => {
    const expectedOutput = doc(
      ol(li(p('One'))),
      p('Two'),
      p('Three'),
      ol(li(p('Four'))),
    );

    it('should allow untoggling part of a list based on selection', async () => {
      const { editorView } = await testEditor(
        doc(
          ol(li(p('One')), li(p('{<}Two')), li(p('Three{>}')), li(p('Four'))),
        ),
      );
      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutput);
    });

    it('should untoggle empty paragraphs in a list', async () => {
      const { editorView } = await testEditor(
        doc(ol(li(p('{<}One')), li(p('Two')), li(p()), li(p('Three{>}')))),
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        doc(p('One'), p('Two'), p(), p('Three')),
      );
    });

    it('should untoggle all list items with different ancestors in selection', async () => {
      const { editorView } = await testEditor(
        doc(
          ol(li(p('One')), li(p('{<}Two')), li(p('Three'))),
          ol(li(p('One{>}')), li(p('Two'))),
        ),
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        doc(ol(li(p('One'))), p('Two'), p('Three'), p('One'), ol(li(p('Two')))),
      );
    });
  });

  describe('converting a list', () => {
    it('should allow converting part of a list based on selection', async () => {
      const expectedOutput = doc(
        ol(li(p('One'))),
        ul(li(p('Two')), li(p('Three'))),
        ol(li(p('Four'))),
      );
      const { editorView } = await testEditor(
        doc(
          ol(li(p('One')), li(p('{<}Two')), li(p('Three{>}')), li(p('Four'))),
        ),
      );

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutput);
    });

    // it('should convert selection inside panel to list', async () => {
    //   const expectedOutput = doc(panel()(ul(li(p('text')))));
    //   const { editorView } = await testEditor(doc(panel()(p('te{<>}xt'))));

    //   toggleBulletList(editorView);
    //   expect(editorView.state.doc).toEqualDocument(expectedOutput);
    // });

    it('should allow converting part of a list based on selection that starts at the end of previous line', async () => {
      const expectedOutput = doc(
        ol(li(p('One'))),
        ul(li(p('Two')), li(p('Three'))),
        ol(li(p('Four'))),
      );
      const { editorView } = await testEditor(
        doc(
          ol(li(p('One{<}')), li(p('Two')), li(p('Three{>}')), li(p('Four'))),
        ),
      ); // When selection starts on previous (empty) node

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutput);
    });

    it('should convert selection to a list when the selection starts with a paragraph and ends inside a list', async () => {
      const expectedOutput = doc(
        ol(li(p('One')), li(p('Two')), li(p('Three')), li(p('Four'))),
      );
      const { editorView } = await testEditor(
        doc(p('{<}One'), ol(li(p('Two{>}')), li(p('Three')), li(p('Four')))),
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutput);
    });

    it('should convert selection to a list when the selection contains a list but starts and end with paragraphs', async () => {
      const expectedOutput = doc(
        ol(li(p('One')), li(p('Two')), li(p('Three')), li(p('Four'))),
      );
      const { editorView } = await testEditor(
        doc(p('{<}One'), ol(li(p('Two')), li(p('Three'))), p('Four{>}')),
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutput);
    });

    it('should convert selection to a list when the selection starts inside a list and ends with a paragraph', async () => {
      const expectedOutput = doc(
        ol(li(p('One')), li(p('Two')), li(p('Three')), li(p('Four'))),
      );
      const { editorView } = await testEditor(
        doc(ol(li(p('One')), li(p('{<}Two')), li(p('Three'))), p('Four{>}')),
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutput);
    });

    it('should convert selection to a list and keep empty paragraphs', async () => {
      const expectedOutput = doc(
        ul(li(p('One')), li(p('Two')), li(p()), li(p('Three'))),
      );
      const { editorView } = await testEditor(
        doc(ol(li(p('{<}One')), li(p('Two')), li(p()), li(p('Three{>}')))),
      );

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutput);
    });

    it('should convert selection to list when there is an empty paragraph between non empty two', async () => {
      const expectedOutput = doc(ul(li(p('One')), li(p()), li(p('Three'))));
      const { editorView } = await testEditor(
        doc(p('{<}One'), p(), p('Three{>}')),
      );

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutput);
    });

    it('should convert selection to a list when it is a paragraph with supported marks', async () => {
      const expectedOutput = doc(
        ul(li(p('One')), li(p(underline('Two'))), li(p('Three'))),
      );
      const { editorView } = await testEditor(
        doc(p('{<}One'), p(underline('Two')), p('Three{>}')),
      );

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutput);
    });

    // it('should retain breakout marks on ancestor when toggling list within a layout', async () => {
    //   const expectedOutput = doc(
    //     breakout({ mode: 'wide' })(
    //       layoutSection(
    //         layoutColumn({ width: 33.33 })(p('')),
    //         layoutColumn({ width: 33.33 })(ul(li(p('One')))),
    //         layoutColumn({ width: 33.33 })(p('')),
    //       ),
    //     ),
    //   );

    //   const { editorView } = await testEditor(
    //     doc(
    //       breakout({ mode: 'wide' })(
    //         layoutSection(
    //           layoutColumn({ width: 33.33 })(p('')),
    //           layoutColumn({ width: 33.33 })(p('{<}One{>}')),
    //           layoutColumn({ width: 33.33 })(p('')),
    //         ),
    //       ),
    //     ),
    //   );

    //   toggleBulletList(editorView);
    //   expect(editorView.state.doc).toEqualDocument(expectedOutput);
    // });
  });

  describe('joining lists', () => {
    const expectedOutputForPreviousList = doc(
      ol(
        li(p('One')),
        li(p('Two')),
        li(p('Three')),
        li(p('Four')),
        li(p('Five')),
      ),
      p('Six'),
    );
    const expectedOutputForNextList = doc(
      p('One'),
      ol(
        li(p('Two')),
        li(p('Three')),
        li(p('Four')),
        li(p('Five')),
        li(p('Six')),
      ),
    );
    const expectedOutputForPreviousAndNextList = doc(
      ol(
        li(p('One')),
        li(p('Two')),
        li(p('Three')),
        li(p('Four')),
        li(p('Five')),
        li(p('Six')),
      ),
    );

    it("should join with previous list if it's of the same type", async () => {
      const { editorView } = await testEditor(
        doc(
          ol(li(p('One')), li(p('Two')), li(p('Three'))),
          p('{<}Four'),
          p('Five{>}'),
          p('Six'),
        ),
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        expectedOutputForPreviousList,
      );
    });

    it("should join with previous list if it's of the same type and selection starts at the end of previous line", async () => {
      const { editorView } = await testEditor(
        doc(
          ol(li(p('One')), li(p('Two')), li(p('Three{<}'))),
          p('Four'),
          p('Five{>}'),
          p('Six'),
        ),
      ); // When selection starts on previous (empty) node

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        expectedOutputForPreviousList,
      );
    });

    it("should not join with previous list if it's not of the same type", async () => {
      const { editorView } = await testEditor(
        doc(
          ol(li(p('One')), li(p('Two')), li(p('Three'))),
          p('{<}Four'),
          p('Five{>}'),
          p('Six'),
        ),
      );

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        doc(
          ol(li(p('One')), li(p('Two')), li(p('Three'))),
          ul(li(p('Four')), li(p('Five'))),
          p('Six'),
        ),
      );
    });

    it("should not join with previous list if it's not of the same type and selection starts at the end of previous line", async () => {
      const { editorView } = await testEditor(
        doc(
          ol(li(p('One')), li(p('Two')), li(p('Three{<}'))),
          p('Four'),
          p('Five{>}'),
          p('Six'),
        ),
      ); // When selection starts on previous (empty) node

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        doc(
          ol(li(p('One')), li(p('Two')), li(p('Three'))),
          ul(li(p('Four')), li(p('Five'))),
          p('Six'),
        ),
      );
    });

    it("should join with next list if it's of the same type", async () => {
      const { editorView } = await testEditor(
        doc(
          p('One'),
          p('{<}Two'),
          p('Three{>}'),
          ol(li(p('Four')), li(p('Five')), li(p('Six'))),
        ),
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutputForNextList);
    });

    it("should join with next list if it's of the same type and selection starts at the end of previous line", async () => {
      const { editorView } = await testEditor(
        doc(
          p('One{<}'),
          p('Two'),
          p('Three{>}'),
          ol(li(p('Four')), li(p('Five')), li(p('Six'))),
        ),
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(expectedOutputForNextList);
    });

    it("should not join with next list if it isn't of the same type", async () => {
      const { editorView } = await testEditor(
        doc(
          p('One'),
          p('{<}Two'),
          p('Three{>}'),
          ol(li(p('Four')), li(p('Five')), li(p('Six'))),
        ),
      );

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        doc(
          p('One'),
          ul(li(p('Two')), li(p('Three'))),
          ol(li(p('Four')), li(p('Five')), li(p('Six'))),
        ),
      );
    });

    it("should not join with next list if it isn't of the same type and selection starts at the end of previous line", async () => {
      const { editorView } = await testEditor(
        doc(
          p('One{<}'),
          p('Two'),
          p('Three{>}'),
          ol(li(p('Four')), li(p('Five')), li(p('Six'))),
        ),
      );

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        doc(
          p('One'),
          ul(li(p('Two')), li(p('Three'))),
          ol(li(p('Four')), li(p('Five')), li(p('Six'))),
        ),
      );
    });

    it("should join with previous and next list if they're of the same type", async () => {
      const { editorView } = await testEditor(
        doc(
          ol(li(p('One')), li(p('Two'))),
          p('{<}Three'),
          p('Four{>}'),
          ol(li(p('Five')), li(p('Six'))),
        ),
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        expectedOutputForPreviousAndNextList,
      );
    });

    it("should join with previous and next list if they're of the same type and selection starts at the end of previous line", async () => {
      const { editorView } = await testEditor(
        doc(
          ol(li(p('One')), li(p('Two{<}'))),
          p('Three'),
          p('Four{>}'),
          ol(li(p('Five')), li(p('Six'))),
        ),
      );

      toggleOrderedList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        expectedOutputForPreviousAndNextList,
      );
    });

    it("should not join with previous and next list if they're not of the same type", async () => {
      const { editorView } = await testEditor(
        doc(
          ol(li(p('One')), li(p('Two'))),
          p('{<}Three'),
          p('Four{>}'),
          ol(li(p('Five')), li(p('Six'))),
        ),
      );

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        doc(
          ol(li(p('One')), li(p('Two'))),
          ul(li(p('Three')), li(p('Four'))),
          ol(li(p('Five')), li(p('Six'))),
        ),
      );
    });

    it("should not join with previous and next list if they're not of the same type and selectoin starts at the end of previous line", async () => {
      const { editorView } = await testEditor(
        doc(
          ol(li(p('One')), li(p('Two{<}'))),
          p('Three'),
          p('Four{>}'),
          ol(li(p('Five')), li(p('Six'))),
        ),
      );

      toggleBulletList(editorView);
      expect(editorView.state.doc).toEqualDocument(
        doc(
          ol(li(p('One')), li(p('Two'))),
          ul(li(p('Three')), li(p('Four'))),
          ol(li(p('Five')), li(p('Six'))),
        ),
      );
    });
  });

  describe('Nested Lists', () => {
    describe('When gap cursor is inside listItem before codeBlock', () => {
      it.skip('should increase the depth of list item when Tab key press', async () => {
        const { editorView } = await testEditor(
          doc(ol(li(p('text')), li(codeBlock()('{<>}text')), li(p('text')))),
        );
        // enable gap cursor
        sendKeyToPm(editorView, 'ArrowLeft');
        expect(editorView.state.selection instanceof GapCursorSelection).toBe(
          true,
        );
        expect(editorView.state.selection.$from.depth).toEqual(2);

        sendKeyToPm(editorView, 'Tab');

        expect(editorView.state.selection.$from.depth).toEqual(4);
      });

      it.skip('should decrease the depth of list item when Shift-Tab key press', async () => {
        const { editorView } = await testEditor(
          doc(
            ol(li(p('text'), ol(li(codeBlock()('{<>}text')))), li(p('text'))),
          ),
        );
        // enable gap cursor
        sendKeyToPm(editorView, 'ArrowLeft');
        expect(editorView.state.selection instanceof GapCursorSelection).toBe(
          true,
        );
        expect(editorView.state.selection.$from.depth).toEqual(4);

        sendKeyToPm(editorView, 'Shift-Tab');

        expect(editorView.state.selection.$from.depth).toEqual(2);
      });
    });

    it('should increase the depth of list item when Tab key press', async () => {
      const { editorView } = await testEditor(
        doc(ol(li(p('text')), li(p('te{<>}xt')), li(p('text')))),
      );
      expect(editorView.state.selection.$from.depth).toEqual(3);

      sendKeyToPm(editorView, 'Tab');

      expect(editorView.state.selection.$from.depth).toEqual(5);
    });

    it("shouldn't increase the depth of list item when Tab key press when at 5 levels indentation", async () => {
      const { editorView } = await testEditor(
        doc(
          ol(
            li(
              p('first'),
              ol(
                li(
                  p('second'),
                  ol(
                    li(
                      p('third'),
                      ol(
                        li(
                          p('fourth'),
                          ol(li(p('fifth'), p('maybe seventh{<>}'))),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      );

      expect(editorView.state.selection.$from.depth).toEqual(11);

      sendKeyToPm(editorView, 'Tab');

      expect(editorView.state.selection.$from.depth).toEqual(11);
    });

    it("shouldn't increase the depth of list item when Tab key press when a child list at 6 levels indentation", async () => {
      const { editorView } = await testEditor(
        doc(
          ol(
            li(
              p('first'),
              ol(
                li(
                  p('second'),
                  ol(
                    li(
                      p('third'),
                      ol(
                        li(
                          p('fourth'),
                          ol(
                            li(p('fifth')),
                            li(p('{<}fifth{>}'), ol(li(p('sixth')))),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      );

      expect(editorView.state.selection.$from.depth).toEqual(11);

      sendKeyToPm(editorView, 'Tab');

      expect(editorView.state.selection.$from.depth).toEqual(11);
    });

    it('should nest the list item when Tab key press', async () => {
      const { editorView } = await testEditor(
        doc(ol(li(p('text')), li(p('te{<>}xt')), li(p('text')))),
      );

      sendKeyToPm(editorView, 'Tab');

      expect(editorView.state.doc).toEqualDocument(
        doc(ol(li(p('text'), ol(li(p('te{<>}xt')))), li(p('text')))),
      );
    });

    it('should decrease the depth of list item when Shift-Tab key press', async () => {
      const { editorView } = await testEditor(
        doc(ol(li(p('text'), ol(li(p('te{<>}xt')))), li(p('text')))),
      );
      expect(editorView.state.selection.$from.depth).toEqual(5);

      sendKeyToPm(editorView, 'Shift-Tab');

      expect(editorView.state.selection.$from.depth).toEqual(3);
    });

    it('should lift the list item when Shift-Tab key press', async () => {
      const { editorView } = await testEditor(
        doc(ol(li(p('text'), ol(li(p('te{<>}xt')))), li(p('text')))),
      );

      sendKeyToPm(editorView, 'Shift-Tab');

      expect(editorView.state.doc).toEqualDocument(
        doc(ol(li(p('text')), li(p('te{<>}xt')), li(p('text')))),
      );
    });

    it('should lift nested and same level list items correctly', async () => {
      const { editorView } = await testEditor(
        doc(
          ol(li(p('some{<>}text'), ol(li(p('B')))), li(p('C'))),

          p('after'),
        ),
      );

      sendKeyToPm(editorView, 'Shift-Tab');

      expect(editorView.state.doc).toEqualDocument(
        doc(
          p('some{<>}text'),
          ol(li(p('B')), li(p('C'))),

          p('after'),
        ),
      );
    });

    it('should lift the list item when Enter key press is done on empty list-item', async () => {
      const { editorView } = await testEditor(
        doc(ol(li(p('text'), ol(li(p('{<>}')))), li(p('text')))),
      );

      sendKeyToPm(editorView, 'Enter');

      expect(editorView.state.doc).toEqualDocument(
        doc(ol(li(p('text')), li(p('{<>}')), li(p('text')))),
      );
    });
  });

  describe('Enter key-press', () => {
    describe('when Enter key is pressed on empty nested list item', () => {
      it('should create new list item in parent list', async () => {
        const { editorView } = await testEditor(
          doc(ol(li(p('text'), ol(li(p('{<>}')))), li(p('text')))),
        );

        sendKeyToPm(editorView, 'Enter');

        expect(editorView.state.doc).toEqualDocument(
          doc(ol(li(p('text')), li(p('{<>}')), li(p('text')))),
        );
      });
    });

    describe('when Enter key is pressed on non-empty nested list item', () => {
      it('should created new nested list item', async () => {
        const { editorView } = await testEditor(
          doc(ol(li(p('text'), ol(li(p('test{<>}')))), li(p('text')))),
        );

        sendKeyToPm(editorView, 'Enter');

        expect(editorView.state.doc).toEqualDocument(
          doc(
            ol(li(p('text'), ol(li(p('test')), li(p('{<>}')))), li(p('text'))),
          ),
        );
      });
    });

    describe('when Enter key is pressed on non-empty top level list item', () => {
      it('should created new list item at top level', async () => {
        const { editorView } = await testEditor(
          doc(ol(li(p('text')), li(p('test{<>}')), li(p('text')))),
        );

        sendKeyToPm(editorView, 'Enter');

        expect(editorView.state.doc).toEqualDocument(
          doc(ol(li(p('text')), li(p('test')), li(p('{<>}')), li(p('text')))),
        );
      });
    });

    // describe('when Enter key is pressed on non-empty top level list item inside panel', () => {
    //   it('should created new list item at top level', async () => {
    //     const { editorView } = await testEditor(
    //       doc(panel()(ol(li(p('text')), li(p('test{<>}')), li(p('text'))))),
    //     );

    //     sendKeyToPm(editorView, 'Enter');

    //     expect(editorView.state.doc).toEqualDocument(
    //       doc(
    //         panel()(
    //           ol(li(p('text')), li(p('test')), li(p('{<>}')), li(p('text'))),
    //         ),
    //       ),
    //     );
    //   });
    // });

    describe('when Enter key is pressed on empty top level list item', () => {
      it('should create new paragraph outside the list', async () => {
        const { editorView } = await testEditor(
          doc(ol(li(p('text')), li(p('{<>}')), li(p('text')))),
        );

        sendKeyToPm(editorView, 'Enter');

        expect(editorView.state.doc).toEqualDocument(
          doc(ol(li(p('text'))), p('{<>}'), ol(li(p('text')))),
        );
      });
    });

    // describe('when Enter key is pressed on empty top level list item inside panel', () => {
    //   it('should create new paragraph outside the list', async () => {
    //     const { editorView } = await testEditor(
    //       doc(panel()(ol(li(p('text')), li(p('{<>}')), li(p('text'))))),
    //     );

    //     sendKeyToPm(editorView, 'Enter');

    //     expect(editorView.state.doc).toEqualDocument(
    //       doc(panel()(ol(li(p('text'))), p('{<>}'), ol(li(p('text'))))),
    //     );
    //   });
    // });
  });

  describe('Toggle - nested list scenarios - to lift items out of list', () => {
    it('should be possible to toggle a simple nested list', async () => {
      const { editorView } = await testEditor(
        doc(ol(li(p('text'), ol(li(p('text{<>}')))), li(p('text')))),
      );

      toggleOrderedList(editorView);

      expect(editorView.state.doc).toEqualDocument(
        doc(ol(li(p('text'))), p('text{<>}'), ol(li(p('text')))),
      );
    });

    it('should be possible to toggle an empty nested list item', async () => {
      const { editorView } = await testEditor(
        doc(ol(li(p('text'), ol(li(p('{<>}')))), li(p('text')))),
      );

      toggleOrderedList(editorView);

      expect(editorView.state.doc).toEqualDocument(
        doc(ol(li(p('text'))), p('{<>}'), ol(li(p('text')))),
      );
    });

    it('should be possible to toggle a selection across different depths in the list', async () => {
      const { editorView } = await testEditor(
        doc(ol(li(p('te{<}xt'), ol(li(p('text{>}')))), li(p('text')))),
      );

      toggleOrderedList(editorView);

      expect(editorView.state.doc).toEqualDocument(
        doc(p('te{<}xt'), p('text{>}'), ol(li(p('text')))),
      );
    });

    it('should be possible to toggle a selection across lists with different parent lists', async () => {
      const { editorView } = await testEditor(
        doc(
          ol(li(p('te{<}xt'), ol(li(p('text'))))),
          ol(li(p('te{>}xt'), ol(li(p('text'))))),
        ),
      );

      toggleOrderedList(editorView);

      expect(editorView.state.doc).toEqualDocument(
        doc(p('te{<}xt'), p('text'), p('te{>}xt'), ol(li(p('text')))),
      );
    });

    it('should be create a new list for children of lifted list item', async () => {
      const { editorView } = await testEditor(
        doc(
          ol(
            li(p('text'), ol(li(p('te{<>}xt'), ol(li(p('text')))))),
            li(p('text')),
          ),
        ),
      );

      toggleOrderedList(editorView);

      expect(editorView.state.doc).toEqualDocument(
        doc(ol(li(p('text'))), p('te{<>}xt'), ol(li(p('text')), li(p('text')))),
      );
    });

    it('should change type to bullet list when toggling orderedList to bulletList', async () => {
      const { editorView } = await testEditor(
        doc(
          ol(
            li(p('text'), ol(li(p('text'), ol(li(p('te{<>}xt')))))),
            li(p('text')),
          ),
        ),
      );

      toggleBulletList(editorView);

      expect(editorView.state.doc).toEqualDocument(
        doc(
          ol(
            li(p('text'), ol(li(p('text'), ul(li(p('te{<>}xt')))))),
            li(p('text')),
          ),
        ),
      );
    });
  });
});

describe('Insert empty list above and below', () => {
  test.each(
    // prettier-ignore
    [
      [
        doc(
          ul(
            li(p('top{<>}'))
          ),
        ), 
        doc(
          ul(
            li(p('{<>}')),
            li(p('top'))
          ),
        )
      ],
      // empty 
      [
        doc(
          ul(
            li(p('{<>}'))
          ),
        ), 
        doc(
          ul(
            li(p('{<>}')),
            li(p()),
          ),
        )
      ],
      // nested
      [
        doc(
          ul(
            li(
              p('first'), 
              ul(
                li(p('{<>}second'))
              )
            )
          )
        ), 
        doc(
          ul(
            li(
              p('first'), 
              ul(
                li(p('{<>}')),
                li(p('second'))
              )
            )
          )
        )
      ],
      // nested but selection in parent
      [
        doc(
          ul(
            li(
              p('first{<>}'), 
              ul(
                li(p('second'))
              )
            )
          )
        ), 
        doc(
          ul(
            li(p('{<>}')),
            li(
              p('first'),
              ul(
                li(p('second'))
              )
            )
          )
        )
      ]
    ],
  )('Case %# insert above', async (input, expected) => {
    const { editor } = await testEditor(input);

    sendKeyToPm(editor.view, 'Cmd-Shift-Enter');

    expect(editor.state).toEqualDocAndSelection(expected);
  });

  test.each(
    // prettier-ignore
    [
      [
        doc(
          ul(
            li(p('top{<>}')),
          ),
        ), 
        doc(
          ul(
            li(p('top')),
            li(p('{<>}')),
          ),
        )
      ],
      // empty 
      [
        doc(
          ul(
            li(p('{<>}')),
          ),
        ), 
        doc(
          ul(
            li(p()),
            li(p('{<>}')),
          ),
        )
      ],
      // nested
      [
        doc(
          ul(
            li(
              p('first'), 
              ul(
                li(p('{<>}second')),
              ),
            )
          )
        ), 
        doc(
          ul(
            li(
              p('first'), 
              ul(
                li(p('second')),
                li(p('{<>}')),
              )
            )
          )
        )
      ],
      // nested but selection in parent
      [
        doc(
          ul(
            li(
              p('first{<>}'), 
              ul(
                li(p('second')),
              ),
            )
          )
        ), 
        doc(
          ul(
            li(
              p('first'),
              ul(
                li(p('second')),
              ),
            ),
            li(p('{<>}')),
          )
        )
      ]
    ],
  )('Case %# insert below', async (input, expected) => {
    const { editor } = await testEditor(input);

    sendKeyToPm(editor.view, 'Cmd-Enter');

    expect(editor.state).toEqualDocAndSelection(expected);
  });
});
