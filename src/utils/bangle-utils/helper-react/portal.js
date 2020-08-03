import * as React from 'react';
import { createPortal } from 'react-dom';
import { objUid } from '../utils/object-uid';
import { SelectiveUpdate } from './selective-update';
import { Emitter } from '../utils/emitter';

const LOG = false;

function log(...args) {
  if (LOG) console.log('portal.js:', ...args);
}

export class PortalProviderAPI extends Emitter {
  #portalsMap = new Map();
  #portals = [...this.#portalsMap.values()];
  #calcPortals = false;

  portalAdd(container, portalElement) {
    log('adding', this.getRenderKey(container));

    this.#calcPortals = true;
    this.#portalsMap.set(container, portalElement);
    this.emit('#root_update');
  }

  portalRemove(container) {
    log('removing', this.getRenderKey(container));

    this.#calcPortals = true;
    this.#portalsMap.delete(container);
    this.emit('#root_update');
  }

  getPortals() {
    if (this.#calcPortals) {
      this.#calcPortals = false;
      this.#portals = [...this.#portalsMap.values()];
    }
    return this.#portals;
  }

  getRenderKey(container) {
    return 'update_' + objUid.get(container);
  }

  render(Element, props, container) {
    const uid = objUid.get(container);
    // If the element already exists communicate
    // to selectively update it, bypassing the entire array re-render in PortalRenderer
    if (this.#portalsMap.has(container)) {
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
    // Note: the context manager takes care of updating
    //  the components i.e. PortalRenderer.render
    this.portalAdd(container, portalElement);
  }

  forceUpdate() {
    log('forcing update');
    this.emit('#force_update');
  }

  remove(container) {
    log('removing', this.getRenderKey(container));
    this.portalRemove(container);
  }

  destroy() {
    log('destroying portal');
    this.#portalsMap = null;
    this.#portals = [];
    super.destroy();
  }
}
