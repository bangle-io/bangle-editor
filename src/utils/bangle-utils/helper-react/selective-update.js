import React from 'react';
import { uuid } from '../utils/js-utils';

const LOG = true;

function log(...args) {
  if (LOG) console.log('SelectiveUpdate', ...args);
}

export class SelectiveUpdate extends React.Component {
  state = this.props.initialProps;
  uid = uuid();
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
    log('shouldComponentUpdate', this.state !== nextState);
    return this.state !== nextState;
  }

  componentWillUnmount() {
    this.props.emitter.off(this.props.renderKey, this.handleUpdate);
    this.props.emitter.off(this.props.forceUpdateKey, this.handleForceUpdate);
  }

  render() {
    log('rendering:', this.props.elementName, this.uid);
    return this.props.render(this.state);
  }
}
