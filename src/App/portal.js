import * as React from 'react';
import {
  createPortal,
  unstable_renderSubtreeIntoContainer,
  unmountComponentAtNode,
} from 'react-dom';

export class EventDispatcher {
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
  constructor() {
    super(...arguments);
    this.portals = new Map();
    this.setContext = (context) => {
      this.context = context;
    };
  }
  render(children, container, hasReactContext = false) {
    this.portals.set(container, { children, hasReactContext });
    unstable_renderSubtreeIntoContainer(this.context, children(), container);
  }
  // TODO: until https://product-fabric.atlassian.net/browse/ED-5013
  // we (unfortunately) need to re-render to pass down any updated context.
  // selectively do this for nodeviews that opt-in via `hasReactContext`
  forceUpdate() {
    this.portals.forEach((portal, container) => {
      if (!portal.hasReactContext) {
        return;
      }
      unstable_renderSubtreeIntoContainer(
        this.context,
        portal.children(),
        container,
      );
    });
  }
  remove(container) {
    this.portals.delete(container);
    unmountComponentAtNode(container);
  }
}
export class PortalProvider extends React.Component {
  constructor(props) {
    super(props);
    this.portalProviderAPI = new PortalProviderAPI();
  }
  render() {
    return this.props.render(this.portalProviderAPI);
  }
  componentDidUpdate() {
    this.portalProviderAPI.forceUpdate();
  }
}
export class PortalRenderer extends React.Component {
  constructor(props) {
    super(props);
    this.handleUpdate = (portals) => this.setState({ portals });
    props.portalProviderAPI.setContext(this);
    props.portalProviderAPI.on('update', this.handleUpdate);
    this.state = { portals: new Map() };
  }
  render() {
    const { portals } = this.state;
    return (
      <>
        {Array.from(portals.entries()).map(([container, children]) =>
          createPortal(children, container),
        )}
      </>
    );
  }
}
