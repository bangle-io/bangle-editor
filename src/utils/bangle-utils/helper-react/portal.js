import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { objUid } from '../utils/object-uid';
import { Emitter } from '../utils/emitter';
import { CachedMap } from '../utils/js-utils';
const LOG = true;

function log(...args) {
  if (LOG) console.log('portal.js:', ...args);
}

export class PortalProviderAPI extends Emitter {
  #portalsMap = new CachedMap();

  getPortals() {
    return this.#portalsMap.arrayValues();
  }

  render(Element, props, container) {
    const renderKey = objUid.get(container);
    // If the element already exists communicate
    // to selectively update it, bypassing the entire array re-render in PortalRenderer
    if (this.#portalsMap.has(container)) {
      log('PortalProviderAPI: updating existing', renderKey);
      this.emit(renderKey, props);
      return;
    }

    log('PortalProviderAPI: creating new', renderKey);

    const SelectiveComp = React.memo(
      (props) => {
        const [state, setState] = useState(props);
        const emitter = this;
        const renderKey = objUid.get(container);

        React.useEffect(() => {
          log('setting up', renderKey);
          emitter.on(renderKey, setState);
          return () => {
            log('emitter.off', renderKey);
            emitter.off(renderKey, setState);
          };
        }, [emitter, renderKey]);
        log('rendering func', renderKey);

        return <Element {...state} />;
      },
      // We never want to update the function via props
      () => true,
    );

    const portalElement = createPortal(
      <SelectiveComp {...props} />,
      container,
      renderKey,
    );

    log('adding', objUid.get(container));
    this.#portalsMap.set(container, portalElement);
    this.emit('#root_update');
  }

  forceUpdate() {
    log('forcing update');
    this.emit('#force_update');
  }

  remove(container) {
    log('removing', objUid.get(container));
    this.#portalsMap.delete(container);
    this.emit('#root_update');
  }

  destroy() {
    log('destroying portal');
    this.#portalsMap = null;
    super.destroy();
  }
}
