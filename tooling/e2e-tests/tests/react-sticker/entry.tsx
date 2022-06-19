import React from 'react';

import { defaultPlugins, defaultSpecs } from '@bangle.dev/all-base-components';
import { NodeViewProps, SpecRegistry } from '@bangle.dev/core';
import {
  DOMSerializer,
  EditorView,
  parseFromClipboard,
  serializeForClipboard,
  Slice,
} from '@bangle.dev/pm';
import { sticker } from '@bangle.dev/react-sticker';
import { stopwatch } from '@bangle.dev/react-stopwatch';

import { setupReactEditor, win } from '../../setup/entry-helpers';

export default function setup() {
  win.__serializeForClipboard = serializeForClipboard;
  win.__parseFromClipboard = parseFromClipboard;

  win.manualPaste = function manualPaste(htmlStr: string) {
    function sliceSingleNode(slice: Slice) {
      return slice.openStart === 0 &&
        slice.openEnd === 0 &&
        slice.content.childCount === 1
        ? slice.content.firstChild
        : null;
    }

    function doPaste(
      view: EditorView,
      text: string | null,
      html: string | null,
      e: ClipboardEvent,
    ) {
      let slice = parseFromClipboard(
        view,
        text as any,
        html,
        (view as any).input.shiftKey,
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
        ? view.state.tr.replaceSelectionWith(
            singleNode,
            (view as any).input.shiftKey,
          )
        : view.state.tr.replaceSelection(slice);
      view.dispatch(
        tr.scrollIntoView().setMeta('paste', true).setMeta('uiEvent', 'paste'),
      );
    }
    const pasteEvent = createEvent('paste') as ClipboardEvent;

    doPaste(win.editor.view, null, htmlStr, pasteEvent);
  };

  console.debug('Bangle-react entry.js');

  win.domSerializer = function domSerializer() {
    return DOMSerializer.fromSchema(win.editor.view.state.schema);
  };

  win.commands = {
    stopwatch: stopwatch.commands,
    sticker: sticker.commands,
  };
  const renderNodeViews = ({ node, ...args }: NodeViewProps) => {
    if (node.type.name === 'sticker') {
      return <sticker.Sticker node={node} {...args} />;
    }
    return undefined;
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

const createEvent = (name: string, options: any = {}) => {
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
