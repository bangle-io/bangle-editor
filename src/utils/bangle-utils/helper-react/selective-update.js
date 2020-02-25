import React from 'react';

export class SelectiveUpdate extends React.Component {
  state = this.props.initialProps;
  componentDidMount() {
    this.props.emitter.on(this.props.renderKey, this.handleUpdate);
    this.props.emitter.on(this.props.forceUpdateKey, this.handleForceUpdate);
  }

  handleUpdate = (props) => {
    this.setState(props);
  };

  handleForceUpdate = () => {
    this.forceUpdate();
  };
  // Only update component via a setState which is due to emitter
  shouldComponentUpdate(nextProps, nextState) {
    return this.state !== nextState;
  }

  componentWillUnmount() {
    this.props.emitter.off(this.props.renderKey, this.handleUpdate);
    this.props.emitter.off(this.props.forceUpdateKey, this.handleForceUpdate);
  }

  render() {
    return this.props.render(this.state);
  }
}
