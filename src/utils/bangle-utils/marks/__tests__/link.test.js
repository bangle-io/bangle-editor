/**
 * @jest-environment jsdom
 */

import '../../../../test-helpers/jest-helpers';

import { doc, p, link, ul, li } from '../../../../test-helpers/test-builders';
import { dispatchPasteEvent } from '../../../../test-helpers/dispatch-paste-event';
import { renderTestEditor } from '../../../../test-helpers';
import { toggleMark } from 'tiptap-commands';
import { Link } from '../link';
import {
  BulletList,
  ListItem,
  OrderedList,
} from '../../../../utils/bangle-utils/nodes';

const extensions = [
  new Link(),
  new BulletList(),
  new ListItem(),
  new OrderedList(),
];

const testEditor = renderTestEditor({ extensions });

test('Creates a link correctly', async () => {
  const { editorView } = await testEditor(doc(p('{<}hello world{>}')));

  toggleMark(editorView.state.schema.marks.link, {
    href: 'https://example.com',
  })(editorView.state, editorView.dispatch);

  expect(editorView.state.doc).toEqualDocument(
    doc(p(link({ href: 'https://example.com' })('hello world'))),
  );
});

test('Creates a link correctly', async () => {
  const { editorView } = await testEditor(doc(p('hello {<}world{>}')));

  toggleMark(editorView.state.schema.marks.link, {
    href: 'https://example.com',
  })(editorView.state, editorView.dispatch);

  expect(editorView.state.doc).toEqualDocument(
    doc(p('hello ', link({ href: 'https://example.com' })('world'))),
  );
});

test('Pastes a link correctly on an empty selection', async () => {
  const { editorView } = await testEditor(doc(p('hello world{<>}')));

  dispatchPasteEvent(editorView, { plain: 'https://example.com' });

  expect(editorView.state.doc).toEqualDocument(
    // prettier-ignore
    doc(
        p(
            'hello world', 
            link({ href: 'https://example.com' })('https://example.com')
        ),
        
    ),
  );
});

test('Pastes a link correctly', async () => {
  const { editorView } = await testEditor(doc(p('hello {<}world{>}')));

  dispatchPasteEvent(editorView, { plain: 'https://example.com' });

  expect(editorView.state.doc).toEqualDocument(
    doc(p('hello ', link({ href: 'https://example.com' })('world'))),
  );
});

test('Paste a link in a list works', async () => {
  const { editorView } = await testEditor(
    doc(
      ul(
        li(p('first')),
        li(p('second'), ul(li(p('nested:1')), li(p('{<}nested:2{>}')))),
      ),
    ),
  );

  dispatchPasteEvent(editorView, { plain: 'https://example.com' });

  expect(editorView.state.doc).toEqualDocument(
    // prettier-ignore
    doc(
        ul(
          li(p('first')),
          li(p('second'), ul(
            li(p('nested:1')), 
            li(p(
                link({ href: 'https://example.com' })('nested:2')
            ))
        ))),
    ),

    doc(p('hello ')),
  );
});
