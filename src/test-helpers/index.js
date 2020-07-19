'use strict';

import prettier from 'prettier';
import {
  EditorContextProvider,
  EditorContext,
  EditorOnReadyContext,
} from 'utils/bangle-utils/helper-react/editor-context';
import { ReactEditor } from 'utils/bangle-utils/helper-react/react-editor';
import React from 'react';
import { render, waitForElement } from '@testing-library/react';
import pmTestBuilder from 'prosemirror-test-builder';
import browser from 'utils/bangle-utils/utils/browser';
import { Text, Paragraph, Doc } from 'utils/bangle-utils/nodes/index';
import {
  EditorState,
  Selection,
  TextSelection,
  NodeSelection,
} from 'prosemirror-state';
import { ExtensionManager } from 'utils/bangle-utils/utils/extension-manager';
import { Schema } from 'prosemirror-model';

export async function renderReactEditor(options = {}, testId = 'test-editor') {
  const _options = {
    id: 'test-editor',
    editorProps: {
      attributes: { class: 'bangle-editor content' },
    },
    extensions: [...(options.extensions || [])],
    doc: options.testDoc,
    selection: options.testDoc && selectionFor(options.testDoc),
    ...options,
  };

  let _editor;

  const result = render(
    <EditorContextProvider>
      <ReactEditor options={_options} />
      <EditorContext.Consumer>
        {(context) => {
          if (context.editor && !_editor) {
            _editor = context.editor;
          }
          return !context.editor ? null : <span data-testid={testId} />;
        }}
      </EditorContext.Consumer>
    </EditorContextProvider>,
  );
  const update = (doc) =>
    _editor.view.updateState(
      EditorState.create({
        doc: doc,
        selection: selectionFor(doc),
        schema: _editor.state.schema,
        plugins: _editor.state.plugins,
        storedMarks: _editor.state.storedMarks,
      }),
    );

  await result.findByTestId('test-editor');
  return {
    ...result,
    editor: _editor,
    builders: pmTestBuilder.builders(_editor.schema, {
      doc: { nodeType: 'doc' },
      p: { nodeType: 'paragraph' },
      text: { nodeType: 'text' },
      li: { nodeType: 'list_item' },
      ul: { nodeType: 'bullet_list' },
      ol: { nodeType: 'ordered_list' },
    }),
    update,
  };
}

function selectionFor(doc) {
  let a = doc.tag.a;
  if (a != null) {
    let $a = doc.resolve(a);
    if ($a.parent.inlineContent)
      return new TextSelection(
        $a,
        doc.tag.b != null ? doc.resolve(doc.tag.b) : undefined,
      );
    else return new NodeSelection($a);
  }
  return Selection.atStart(doc);
}

export const jestExpect = {
  toEqualDoc,
};

expect.extend(jestExpect);

function toEqualDoc(received, expected) {
  if (received.type.name !== 'doc') {
    throw new Error('Received is not a valid PM doc. Please wrap with doc()');
  }
  if (expected.type.name !== 'doc') {
    throw new Error('expected is not a valid PM doc. Please wrap with doc()');
  }

  const frmt = (doc) =>
    prettier.format(doc.toString(), {
      semi: false,
      parser: 'babel',
      printWidth: 40,
      singleQuote: true,
    });
  const options = {
    comment: 'PM Doc .eq equality',
    isNot: this.isNot,
    promise: this.promise,
  };

  const pass = received.eq(expected);
  let message;
  if (pass) {
    message = () =>
      this.utils.matcherHint('toEqualDoc', undefined, undefined, options) +
      '\n\n' +
      `Expected: not ${this.utils.printExpected(expected.toJSON())}\n` +
      `Received: ${this.utils.printReceived(received.toJSON())}`;
  } else {
    const diffString = this.utils.diff(frmt(expected), frmt(received), {
      expand: this.expand,
    });
    message = () =>
      this.utils.matcherHint('toEqualDoc', undefined, undefined, options) +
      '\n\n' +
      (diffString && diffString.includes('- Expect')
        ? `Difference:\n\n${diffString}`
        : `Expected: ${this.utils.printExpected(expected.toJSON())}\n` +
          `Received: ${this.utils.printReceived(received.toJSON())}`);
  }
  return {
    pass,
    message,
  };
}

export function sendKeyToPm(editorView, keys) {
  const keyCodes = {
    'Enter': 13,
    'Backspace': 8,
    'Tab': 9,
    'Shift': 16,
    'Ctrl': 17,
    'Alt': 18,
    'Pause': 19,
    'CapsLock': 20,
    'Esc': 27,
    'Space': 32,
    'PageUp': 63276,
    'PageDown': 63277,
    'End': 63275,
    'Home': 63273,
    'Left': 63234,
    'Up': 63232,
    'Right': 63235,
    'Down': 63233,
    'PrintScrn': 44,
    'Insert': 63302,
    'Delete': 46,
    ';': 186,
    '=': 187,
    'Mod': 93,
    '*': 106,
    '-': 189,
    '.': 190,
    '/': 191,
    ',': 188,
    '`': 192,
    '[': 219,
    '\\': 220,
    ']': 221,
    "'": 222,
  };

  const event = new CustomEvent('keydown', {
    bubbles: true,
    cancelable: true,
  });
  event.DOM_KEY_LOCATION_LEFT = 1;
  event.DOM_KEY_LOCATION_RIGHT = 2;

  let parts = keys.split(/-(?!'?$)/);

  // set location property of event if Left or Right version of key specified
  let location = 0;
  const locationKeyRegex = /^(Left|Right)(Ctrl|Alt|Mod|Shift|Cmd)$/;
  parts = parts.map((part) => {
    if (part.search(locationKeyRegex) === -1) {
      return part;
    }
    const [, pLocation, pKey] = part.match(locationKeyRegex);
    location =
      pLocation === 'Left'
        ? event.DOM_KEY_LOCATION_LEFT
        : event.DOM_KEY_LOCATION_RIGHT;
    return pKey;
  });

  const modKey = parts.indexOf('Mod') !== -1;
  const cmdKey = parts.indexOf('Cmd') !== -1;
  const ctrlKey = parts.indexOf('Ctrl') !== -1;
  const shiftKey = parts.indexOf('Shift') !== -1;
  const altKey = parts.indexOf('Alt') !== -1;
  const key = parts[parts.length - 1];

  // all of the browsers are using the same keyCode for alphabetical keys
  // and it's the uppercased character code in real world
  const code = keyCodes[key] ? keyCodes[key] : key.toUpperCase().charCodeAt(0);

  event.key = key.replace(/Space/g, ' ');
  event.shiftKey = shiftKey;
  event.altKey = altKey;
  event.ctrlKey = ctrlKey || (!browser.mac && modKey);
  event.metaKey = cmdKey || (browser.mac && modKey);
  event.keyCode = code;
  event.which = code;
  event.view = window;
  event.location = location;

  editorView.dispatchEvent(event);
}

export function insertText(view, text, from, _to) {
  let pos = typeof from === 'number' ? from : view.state.selection.from;

  text.split('').forEach((character, index) => {
    if (
      !view.someProp('handleTextInput', (f) =>
        f(view, pos + index, pos + index, character),
      )
    ) {
      view.dispatch(
        view.state.tr.insertText(character, pos + index, pos + index),
      );
    }
  });
}

export function sleep(t = 20) {
  return new Promise((res) => setTimeout(res, t));
}

export function builders(extensions = []) {
  const schema = getSchema(extensions);
  return {
    schema,
    ...pmTestBuilder.builders(schema, {
      doc: { nodeType: 'doc' },
      p: { nodeType: 'paragraph' },
      text: { nodeType: 'text' },
      li: { nodeType: 'list_item' },
      ul: { nodeType: 'bullet_list' },
      ol: { nodeType: 'ordered_list' },
    }),
  };
}

export function getSchema(extensions = []) {
  const baseExtns = [new Doc(), new Text(), new Paragraph()];
  const manager = new ExtensionManager([...baseExtns, ...extensions], {});

  const schema = new Schema({
    topNode: 'doc',
    marks: manager.marks,
    nodes: manager.nodes,
  });

  return schema;
}
