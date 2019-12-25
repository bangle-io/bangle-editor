import React from 'react';
import ReactDOM from 'react-dom';
import debounce from 'debounce';

export default class Tooltip extends React.PureComponent {
  constructor(props) {
    super(props);

    this.tooltip = window.document.createElement('div');

    this.updateTooltipPosition = debounce(this.setState.bind(this), 20);
    window.document.body.appendChild(this.tooltip);
  }

  _computeBox(coords) {
    const box = this.tooltip.offsetParent.getBoundingClientRect();
    const left = Math.max((coords.left + coords.left) / 2, coords.left + 3);
    return {
      left: left - box.left,
      bottom: box.bottom - coords.top,
    };
  }

  componentDidMount() {
    document.body.appendChild(this.tooltip);
  }

  componentWillUnmount() {
    this.updateTooltipPosition.clear();
    this.tooltip.remove();
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
        {this.props.query} {this.props.index}
      </div>,
      this.tooltip,
    );
  }
}
