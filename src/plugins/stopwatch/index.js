// import './stopwatch.css';

import React, { useState, useEffect } from 'react';

import { Node } from '../../utils/bangle-utils/nodes/index';
import { getIdleCallback } from '../../utils/bangle-utils/utils/js-utils';

const LOG = true;

function log(...args) {
  if (LOG) console.log('stopwatch/index.js:', ...args);
}

export default class StopwatchExtension extends Node {
  get defaultOptions() {
    return {};
  }

  get name() {
    return 'stopwatch';
  }

  get schema() {
    return {
      attrs: {
        'data-stopwatch-time': {
          default: Date.now(),
        },
        'data-stopwatch-paused': {
          default: 0,
        },
        'data-type': {
          default: this.name,
        },
      },
      inline: true,
      group: 'inline',
      draggable: true,
      atom: true,
      // NOTE: Seems like this is used as an output to outside world
      //      when you like copy or drag
      toDOM: (node) => {
        const {
          'data-stopwatch-time': stopwatchtime,
          'data-stopwatch-paused': paused,
        } = node.attrs;
        return [
          'span',
          {
            'data-type': this.name,
            'data-stopwatch-time': JSON.stringify(stopwatchtime),
            'data-stopwatch-paused': JSON.stringify(paused),
          },
        ];
      },
      // NOTE: this is the opposite part where you parse the output of toDOM
      //      When getAttrs returns false, the rule won't match
      //      Also, it only takes attributes defined in spec.attrs
      parseDOM: [
        {
          tag: `span[data-type="${this.name}"]`,
          getAttrs: (dom) => {
            return {
              'data-type': this.name,
              'data-stopwatch-time': JSON.parse(
                dom.getAttribute('data-stopwatch-time'),
              ),
              'data-stopwatch-paused': JSON.parse(
                dom.getAttribute('data-stopwatch-paused'),
              ),
            };
          },
        },
      ],
    };
  }

  render = (props) => {
    return <StopwatchComponent {...props} />;
  };

  commands({ type, schema }) {
    return () => {
      return this._insertStopwatch(type);
    };
  }

  keys({ schema, type }) {
    return {
      'Shift-Ctrl-s': this._insertStopwatch(type),
    };
  }

  _insertStopwatch(type) {
    let stopwatchType = type;
    return function (state, dispatch) {
      let { $from } = state.selection,
        index = $from.index();
      if (!$from.parent.canReplaceWith(index, index, stopwatchType))
        return false;
      if (dispatch) {
        const attr = {
          'data-stopwatch-time': Date.now() + '',
        };

        dispatch(state.tr.replaceSelectionWith(stopwatchType.create(attr)));
      }
      return true;
    };
  }
}

function StopwatchComponent({ node, updateAttrs, selected }) {
  let {
    'data-stopwatch-time': stopwatchtime,
    'data-stopwatch-paused': paused,
  } = node.attrs;

  stopwatchtime = parseInt(stopwatchtime, 10);

  const [, setCounter] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      log('setting interval');
      if (paused === 0) {
        getIdleCallback(() => setCounter((counter) => counter + 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [paused]);

  const endTime = paused !== 0 ? paused : Date.now();
  return (
    <span
      contentEditable={false}
      style={{
        'backgroundColor': !paused ? '#00CED1' : 'pink',
        'outline': selected ? '2px solid blue' : null,
        'border-radius': 10,
        'padding': '1px 2px 1px 2px',
        'margin': '1px 2px',
        'fontWeight': 500,
        'fontFamily': 'monospace',
      }}
      onClick={() => {
        if (paused === 0) {
          updateAttrs({
            'data-stopwatch-paused': Date.now(),
          });
          return;
        }
        updateAttrs({
          'data-stopwatch-paused': 0,
          'data-stopwatch-time': stopwatchtime + (Date.now() - paused),
        });
      }}
    >
      ⏲{((endTime - stopwatchtime) / 1000).toFixed(0)}
    </span>
  );
}
