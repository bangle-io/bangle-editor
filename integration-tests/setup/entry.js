import './entry.css';
import React from 'react';
import reactDOM from 'react-dom';
import {
  defaultPlugins,
  defaultSpecs,
} from 'bangle-core/test-helpers/default-components';
import { SpecRegistry } from 'bangle-core/spec-registry';
import { DOMSerializer, Slice } from 'bangle-core/pm-model';
import { sticker } from '@banglejs/sticker';
import { stopwatch } from '@banglejs/stopwatch';
import * as prosemirrorView from 'bangle-core/pm-view';
import { ReactEditor } from 'bangle-react/ReactEditor';

window.prosemirrorView = prosemirrorView;

console.debug('Bangle-react entry.js');

setup();

function setup() {
  const element = document.createElement('div');
  window.document.body.appendChild(element);
  element.setAttribute('id', 'root');
  // const editorContainer = document.createElement('div');
  // editorContainer.setAttribute('id', 'pm-root');
  // element.appendChild(editorContainer);
  // setupEditor(editorContainer);
  reactDOM.render(<App />, element);
}

function App() {
  const specRegistry = new SpecRegistry([
    ...defaultSpecs(),
    stopwatch.spec(),
    sticker.spec(),
  ]);
  window.commands = {
    stopwatch: stopwatch.commands,
    sticker: sticker.commands,
  };
  const plugins = [...defaultPlugins(), stopwatch.plugins(), sticker.plugins()];
  const onEditorReady = (_editor) => {
    window.editor = _editor;
  };
  const renderNodeViews = ({ node, ...args }) => {
    if (node.type.name === 'sticker') {
      return <sticker.Sticker node={node} {...args} />;
    }
  };

  window.dispatcher = (command) => {
    return command(
      window.editor.view.state,
      window.editor.view.dispatch,
      window.editor.view,
    );
  };

  return (
    <ReactEditor
      options={{ id: 'pm-root', specRegistry, plugins }}
      onReady={onEditorReady}
      renderNodeViews={renderNodeViews}
    />
  );
}

const createEvent = (name, options = {}) => {
  let event;
  if (options.bubbles === undefined) {
    options.bubbles = true;
  }
  if (options.cancelable === undefined) {
    options.cancelable = true;
  }
  if (options.composed === undefined) {
    options.composed = true;
  }
  event = new Event(name, options);

  return event;
};

window.manualPaste = function manualPaste(htmlStr) {
  function sliceSingleNode(slice) {
    return slice.openStart === 0 &&
      slice.openEnd === 0 &&
      slice.content.childCount === 1
      ? slice.content.firstChild
      : null;
  }

  function doPaste(view, text, html, e) {
    let slice = prosemirrorView.__parseFromClipboard(
      view,
      text,
      html,
      view.shiftKey,
      view.state.selection.$from,
    );

    if (
      view.someProp('handlePaste', (f) => f(view, e, slice || Slice.empty)) ||
      !slice
    ) {
      return;
    }

    let singleNode = sliceSingleNode(slice);
    let tr = singleNode
      ? view.state.tr.replaceSelectionWith(singleNode, view.shiftKey)
      : view.state.tr.replaceSelection(slice);
    view.dispatch(
      tr.scrollIntoView().setMeta('paste', true).setMeta('uiEvent', 'paste'),
    );
  }
  const pasteEvent = createEvent('paste');

  doPaste(window.editor.view, null, htmlStr, pasteEvent);
};

window.domSerializer = function domSerializer() {
  return DOMSerializer.fromSchema(window.editor.view.state.schema);
};
