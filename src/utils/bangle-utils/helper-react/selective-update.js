import React from 'react';

export class SelectiveUpdate extends React.Component {
  state = this.props.initialProps;
  componentDidMount() {
    this.props.emitter.on(this.props.renderKey, (props) => {
      this.setState(props);
    });
    this.props.emitter.on(this.props.forceUpdateKey, (props) => {
      this.forceUpdate();
    });
  }
  // Only update component via a setState which is due to emitter
  shouldComponentUpdate(nextProps, nextState) {
    return this.state !== nextState;
  }

  render() {
    return this.props.render(this.state);
  }
}
