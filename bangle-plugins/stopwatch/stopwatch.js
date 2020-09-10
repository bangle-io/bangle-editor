import React from 'react';

import { Node } from 'bangle-core/nodes';

const LOG = false;

function log(...args) {
  if (LOG) {
    console.log('stopwatch/index.js:', ...args);
  }
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
        'data-stopwatch': {
          default: JSON.stringify({
            startTime: 0,
            stopTime: 0,
          }),
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
        return [
          'span',
          {
            'data-type': this.name,
            'data-stopwatch': node.attrs['data-stopwatch'],
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
              'data-stopwatch': dom.getAttribute('data-stopwatch'),
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
      if (!$from.parent.canReplaceWith(index, index, stopwatchType)) {
        return false;
      }
      if (dispatch) {
        dispatch(state.tr.replaceSelectionWith(stopwatchType.create()));
      }
      return true;
    };
  }
}

class StopwatchComponent extends React.Component {
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
      'data-stopwatch': JSON.stringify({
        stopTime,
        startTime,
      }),
    });
  }

  getAttrs() {
    const { stopTime, startTime } = JSON.parse(
      this.props.node.attrs['data-stopwatch'],
    );

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
