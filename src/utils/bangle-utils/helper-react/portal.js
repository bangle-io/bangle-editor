import React from 'react';
import reactDOM from 'react-dom';
import { objUid } from '../utils/object-uid';
import { Emitter } from '../utils/emitter';
import { CachedMap } from '../utils/js-utils';

const LOG = false;

function log(...args) {
  if (LOG) {
    console.log('portal.js:', ...args);
  }
}

export class PortalProviderAPI extends Emitter {
  #portalsMap = new CachedMap();

  getPortals() {
    return this.#portalsMap.arrayValues();
  }

  // Returns true if a new element was added
  // false if an element already existed
  render({ dom, extension, renderingPayload }) {
    const renderKey = objUid.get(dom);
    // If the element already exists communicate
    // to selectively update it, bypassing the entire array re-render in PortalRenderer
    if (this.#portalsMap.has(dom)) {
      log('PortalProviderAPI: updating existing', renderKey);
      this.emit(renderKey, renderingPayload);
      return false;
    }

    log('PortalProviderAPI: creating new', renderKey);

    if (!extension.render.displayName) {
      extension.render.displayName = `ParentNodeView[${extension.name}]`;
    }

    const portalElement = createPortal({
      Element: extension.render,
      emitter: this,
      renderKey,
      childProps: renderingPayload,
      forceUpdateKey: '#force_update',
      dom: dom,
    });

    log('adding', renderKey);
    this.#portalsMap.set(dom, portalElement);
    return true;
  }

  forceUpdate() {
    log('forcing update');
    this.emit('#force_update');
  }

  remove(dom) {
    const renderKey = objUid.get(dom);
    log('removing', renderKey);
    this.#portalsMap.delete(dom);
    return true;
  }

  destroy() {
    log('destroying portal');
    this.#portalsMap = null;
    super.destroy();
  }
}

function createPortal({
  Element,
  emitter,
  renderKey,
  childProps,
  forceUpdateKey,
  dom,
}) {
  class SelectiveUpdate extends React.Component {
    static displayName = `SelectiveUpdate_${renderKey}[${Element.displayName}]`;

    static getDerivedStateFromError(error) {
      return { hasError: true, childProps: null };
    }

    state = {
      hasError: false,
      childProps: childProps,
    };

    shouldComponentUpdate(nextProps, nextState) {
      // We never want to update the function via props
      // instead it will be updated via the emitter
      if (this.state.hasError !== nextState.hasError) {
        return true;
      }
      return this.state.childProps !== nextState.childProps;
    }

    componentDidCatch(error, errorInfo) {
      console.log(errorInfo);
      console.error(error);
    }

    componentDidMount() {
      emitter.on(renderKey, this.handleUpdate);
      emitter.on(forceUpdateKey, this.forceUpdate);
    }

    componentWillUnmount() {
      emitter.off(renderKey, this.handleUpdate);
      emitter.off(forceUpdateKey, this.forceUpdate);
    }

    handleUpdate = (childProps) => {
      this.setState({
        childProps,
      });
    };

    render() {
      if (this.state.hasError) {
        return (
          <div style={{ backgroundColor: 'red', color: 'white' }}>
            Error in {Element.displayName}
          </div>
        );
      }
      log('rendering:', renderKey);
      return <Element {...this.state.childProps} />;
    }
  }

  return reactDOM.createPortal(<SelectiveUpdate />, dom, renderKey);
}
