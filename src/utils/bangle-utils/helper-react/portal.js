import * as React from 'react';
import { createPortal } from 'react-dom';
import { objUid } from '../utils/object-uid';

class EventDispatcher {
  constructor() {
    this.listeners = {};
  }
  on(event, cb) {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event].add(cb);
  }
  off(event, cb) {
    if (!this.listeners[event]) {
      return;
    }
    if (this.listeners[event].has(cb)) {
      this.listeners[event].delete(cb);
    }
  }
  emit(event, data) {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event].forEach((cb) => cb(data));
  }
  destroy() {
    this.listeners = {};
  }
}

export class PortalProviderAPI extends EventDispatcher {
  constructor(...args) {
    super(...args);
    this.portals = new Map();
    this.setContext = (context) => {
      this.context = context;
    };
  }
  render(children, container) {
    this.portals.set(
      container,
      createPortal(children, container, objUid.get(container)),
    );
    this.emit('update');
  }

  // TODO: until https://product-fabric.atlassian.net/browse/ED-5013
  // we (unfortunately) need to re-render to pass down any updated context.
  // selectively do this for nodeviews that opt-in via `hasReactContext`
  forceUpdate() {
    console.log('forcing update');
    this.emit('update');
  }
  remove(container) {
    this.portals.delete(container);
    this.emit('update');
  }
}

export class PortalRenderer extends React.Component {
  constructor(props) {
    super(props);
    this.handleUpdate = () =>
      this.setState({ portals: props.portalProviderAPI.portals });
    props.portalProviderAPI.setContext(this);
    props.portalProviderAPI.on('update', this.handleUpdate);
    this.state = { portals: props.portalProviderAPI.portals };
  }
  render() {
    return [...this.state.portals.values()];
  }
}
