import '../setup/entry.css';
import React from 'react';
import {
  defaultPlugins,
  defaultSpecs,
} from '@bangle.dev/core/test-helpers/default-components';
import { SpecRegistry } from '@bangle.dev/core/spec-registry';
import { DOMSerializer, Slice } from '@bangle.dev/core/prosemirror/model';
import { sticker } from '@bangle.dev/react-sticker';
import { stopwatch } from '@bangle.dev/react-stopwatch';
import { setupReactEditor } from '../setup/entry-helpers';
import {
  __serializeForClipboard,
  __parseFromClipboard,
} from '@bangle.dev/core/prosemirror/view';

window.__serializeForClipboard = __serializeForClipboard;
window.__parseFromClipboard = __parseFromClipboard;

console.debug('Bangle-react entry.js');

setup();

function setup() {
  window.commands = {
    stopwatch: stopwatch.commands,
    sticker: sticker.commands,
  };
  const renderNodeViews = ({ node, ...args }) => {
    if (node.type.name === 'sticker') {
      return <sticker.Sticker node={node} {...args} />;
    }
  };
  const specRegistry = new SpecRegistry([
    ...defaultSpecs(),
    stopwatch.spec(),
    sticker.spec(),
  ]);
  const plugins = () => [
    ...defaultPlugins(),
    stopwatch.plugins(),
    sticker.plugins(),
  ];

  setupReactEditor({ specRegistry, plugins, renderNodeViews, id: 'pm-root' });
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
    let slice = __parseFromClipboard(
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
