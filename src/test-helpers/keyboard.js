'use strict';

import browser from 'utils/bangle-utils/utils/browser';

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
