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
      const editor = new Editor(node, this.options);
      this.setState({
        editor,
      });
      if (this.options.devtools) {
        applyDevTools(editor.view);
        window.editor = editor;
      }
      editor.focus();
    }
  }

  renderNodeView = (args) => {
    // comes from custom-node-view.js#renderComp
    const { node, view, handleRef, updateAttrs, dom, extension } = args;

    if (!extension.render.displayName) {
      extension.render.displayName = `ParentNodeView[${extension.name}]`;
    }
    this.portalProviderAPI.render(
      <extension.render
        {...{
          node,
          view,
          handleRef,
          updateAttrs,
        }}
      />,
      dom,
    );
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
