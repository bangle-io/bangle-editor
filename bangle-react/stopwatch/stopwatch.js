import React from 'react';

import { serializeAtomNodeToMdLink } from 'bangle-plugins/markdown/markdown-serializer';
import { keymap } from 'prosemirror-keymap';
import { NodeView } from 'bangle-core/node-view';
import { domSerializationHelpers } from 'bangle-core/dom-serialization-helpers';

const LOG = false;

function log(...args) {
  if (LOG) {
    console.log('stopwatch/index.js:', ...args);
  }
}

const name = 'stopwatch';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {};

function specFactory() {
  const spec = {
    name,
    type: 'node',
    schema: {
      attrs: {
        'data-stopwatch': {
          default: {
            startTime: 0,
            stopTime: 0,
          },
        },
        'data-bangle-name': {
          default: name,
        },
      },
      inline: true,
      group: 'inline',
      draggable: true,
      atom: true,
    },
    markdown: {
      toMarkdown: (state, node) => {
        const string = serializeAtomNodeToMdLink(name, node.attrs);
        state.write(string);
      },
    },
  };

  spec.schema = {
    ...spec.schema,
    ...domSerializationHelpers(name, { tag: 'span' }),
  };

  return spec;
}

function pluginsFactory(opts = {}) {
  return [
    keymap({
      'Shift-Ctrl-s': insertStopwatch(),
    }),
    NodeView.createPlugin({ name, containerDOM: ['span'] }),
  ];
}

export class Stopwatch extends React.Component {
  state = {
    counter: 0,
  };

  isPaused = () => {
    const { stopTime } = this.getAttrs();

    return stopTime === 0 || stopTime > 0;
  };
  componentDidMount() {
    this.interval = setInterval(() => {
      log('setting interval');
      if (!this.isPaused()) {
        requestAnimationFrame(() => this.incrementCounter());
      }
    }, 1000);
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  updateAttrs({ stopTime, startTime }) {
    this.props.updateAttrs({
      'data-stopwatch': {
        stopTime,
        startTime,
      },
    });
  }

  getAttrs() {
    const { stopTime, startTime } = this.props.node.attrs['data-stopwatch'];

    return {
      stopTime,
      startTime,
    };
  }

  incrementCounter = () => {
    this.setState({
      counter: this.state.counter + 1,
    });
  };

  render() {
    const { selected } = this.props;
    const { stopTime, startTime } = this.getAttrs();
    const now = Date.now();

    let endTime = stopTime ? stopTime : now;

    // the initial values
    if (stopTime === 0 && startTime === 0) {
      endTime = 0;
    }

    const isPaused = this.isPaused();

    return (
      <span
        className="stopwatch"
        contentEditable={false}
        style={{
          backgroundColor: isPaused ? 'pink' : '#00CED1',
          outline: selected ? '2px solid blue' : null,
          borderRadius: 10,
          padding: '1px 2px 1px 2px',
          margin: '1px 2px',
          fontWeight: 500,
          fontFamily: 'monospace',
        }}
        onClick={() => {
          if (!isPaused) {
            this.updateAttrs({ stopTime: now, startTime });
            return;
          }

          // resume a stopped stopwatch
          this.updateAttrs({
            startTime: startTime + (now - stopTime),
            stopTime: null,
          });
        }}
      >
        ⏲{formatTime(((endTime - startTime) / 1000).toFixed(0))}
      </span>
    );
  }
}

function formatTime(secs) {
  var sec_num = parseInt(secs, 10);
  var hours = Math.floor(sec_num / 3600) % 24;
  var minutes = Math.floor(sec_num / 60) % 60;
  var days = Math.floor(sec_num / (24 * 3600));
  var seconds = sec_num % 60;
  const result = [hours, minutes, seconds]
    .map((v) => (v < 10 ? '0' + v : v))
    .join(':');

  return days > 0 ? days + 'd ' + result : result;
}

export function insertStopwatch() {
  return function (state, dispatch) {
    let stopwatchType = state.schema.nodes[name];
    let { $from } = state.selection,
      index = $from.index();
    if (!$from.parent.canReplaceWith(index, index, stopwatchType)) {
      return false;
    }
    if (dispatch) {
      dispatch(state.tr.replaceSelectionWith(stopwatchType.create()));
    }
    return true;
  };
}
