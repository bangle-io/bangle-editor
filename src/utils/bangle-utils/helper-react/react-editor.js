import React from 'react';
import applyDevTools from 'prosemirror-dev-tools';

import { Editor } from '../';

import { PortalRenderer, PortalProviderAPI } from './portal';

export class ReactEditor extends React.PureComponent {
  constructor(props) {
    super(props);

    this.myRef = React.createRef();
    this.portalProviderAPI = new PortalProviderAPI();

    this.defaultOptions = {
      componentClassName: 'ProsemirrorComp',
      renderNodeView: this.renderNodeView,
      destroyNodeView: this.destroyNodeView,
    };

    this.options = Object.assign({}, this.defaultOptions, this.props.options);
  }
  componentDidMount() {
    const node = this.myRef.current;
    if (node) {
      this.editor = new Editor(node, this.options);
      if (this.options.devtools) {
        applyDevTools(this.editor.view);
        window.editor = this.editor;
      }
      this.editor.focus();
    }
  }

  componentWillUnmount() {
    this.portalProviderAPI.destroy();
    this.editor.destroy();
  }

  // comes from custom-node-view.js#renderComp
  renderNodeView = ({ dom, extension, renderingPayload }) => {
    if (!extension.render.displayName) {
      extension.render.displayName = `ParentNodeView[${extension.name}]`;
    }
    this.portalProviderAPI.render(extension.render, renderingPayload, dom);
  };

  destroyNodeView = (dom) => {
    this.portalProviderAPI.remove(dom);
  };

  render() {
    return (
      <>
        <div ref={this.myRef} className={this.options.componentClassName} />
        <PortalRenderer portalProviderAPI={this.portalProviderAPI} />
      </>
    );
  }
}
