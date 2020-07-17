import * as React from 'react';
import { createPortal } from 'react-dom';
import { objUid } from '../utils/object-uid';
import { EventDispatcher } from '../utils/event-dispatcher';
import { SelectiveUpdate } from './selective-update';

const LOG = true;

function log(...args) {
  if (LOG) console.log(...args);
}

export class PortalProviderAPI extends EventDispatcher {
  portals = new Map();

  getRenderKey(container) {
    return 'update_' + objUid.get(container);
  }

  render(Element, props, container) {
    const uid = objUid.get(container);
    // If the element already exists communicate with SelectiveUpdateComponent
    // to selectively update it, bypassing the entire array re-render in PortalRenderer
    if (this.portals.has(container)) {
      log('PortalProviderAPI: updating existing', uid);
      this.emit(this.getRenderKey(container), props);
      return;
    }

    log('PortalProviderAPI: creating new', uid);

    const portalElement = createPortal(
      <SelectiveUpdate
        renderKey={this.getRenderKey(container)}
        forceUpdateKey="#force_update"
        emitter={this}
        initialProps={props}
        render={(props) => <Element {...props} />}
      />,
      container,
      uid,
    );

    this.portals.set(container, portalElement);
    this.emit('#root_update');
  }

  forceUpdate() {
    log('forcing update');
    this.emit('#force_update');
  }

  remove(container) {
    log('removing', this.getRenderKey(container));
    this.portals.delete(container);
    this.emit('#root_update');
  }
}

export class PortalRenderer extends React.Component {
  constructor(props) {
    super(props);

    props.portalProviderAPI.on('#root_update', this.handleUpdate);
    props.portalProviderAPI.on('#force_update', this.handleUpdate);
  }

  handleUpdate = () => {
    this.forceUpdate();
  };

  componentWillUnmount() {
    this.props.portalProviderAPI.off('#root_update', this.handleUpdate);
    this.props.portalProviderAPI.off('#force_update', this.handleUpdate);
  }

  render() {
    log('PortalRenderer: rendering');
    return [...this.props.portalProviderAPI.portals.values()];
  }
}
