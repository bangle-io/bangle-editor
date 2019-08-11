import React from 'react';
import ReactDOM from 'react-dom';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import debounce from 'debounce';

type Position = { left: number; right: number; top: number; bottom: number };
export default class Tooltip extends React.PureComponent<{
  addPlugins: (a: Array<any>) => void;
  coords?: Position;
  text?: string;
}> {
  tooltip = window.document.createElement('div');
  updateTooltipPosition = debounce(this.setState.bind(this), 20);

  state = {
    show: false,
    left: 0,
    bottom: 0,
    textContent: '',
  };

  constructor(props) {
    super(props);
    window.document.body.appendChild(this.tooltip);
  }

  componentDidMount() {
    document.body.appendChild(this.tooltip);
  }

  componentWillUnmount() {
    this.updateTooltipPosition.clear();
    this.tooltip.remove();
  }

  _hideTooltip = () => {
    this.updateTooltipPosition.clear();
    this.setState({
      show: false,
    });
  };

  _pmPluginUpdate = (view: EditorView, lastState?: EditorState) => {
    const tooltip = this.tooltip;
    let state = view.state;
    // Don't do anything if the document/selection didn't change
    if (
      lastState &&
      lastState.doc.eq(state.doc) &&
      lastState.selection.eq(state.selection)
    ) {
      return;
    }

    // Hide the tooltip if the selection is empty
    if (state.selection.empty) {
      this._hideTooltip();
      return;
    }

    // Otherwise, reposition it and update its content
    // tooltip.style.display = '';
    let { from, to } = state.selection;
    // These are in screen coordinates
    let start = view.coordsAtPos(from),
      end = view.coordsAtPos(to);
    // The box in which the tooltip is positioned, to use as base
    let box = tooltip.offsetParent!.getBoundingClientRect();
    // Find a center-ish x position from the selection endpoints (when
    // crossing lines, end may be more to the left)
    let left = Math.max((start.left + end.left) / 2, start.left + 3);
    this.updateTooltipPosition({
      show: true,
      left: left - box.left,
      bottom: box.bottom - start.top,
      textContent: to - from,
    });
  };

  _computeBox(coords) {
    const box = this.tooltip.offsetParent!.getBoundingClientRect();
    const left = Math.max((coords.left + coords.left) / 2, coords.left + 3);
    return {
      left: left - box.left,
      bottom: box.bottom - coords.top,
    };
  }
  render() {
    if (!this.props.coords) {
      return ReactDOM.createPortal(null, this.tooltip);
    }
    const { left, bottom } = this._computeBox(this.props.coords);

    return ReactDOM.createPortal(
      <div
        className="tooltip"
        style={{
          left,
          bottom,
        }}
      >
        {this.props.text} {this.props.index}
      </div>,
      this.tooltip,
    );
  }
}
