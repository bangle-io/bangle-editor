import React from 'react';
import applyDevTools from 'prosemirror-dev-tools';
import PropTypes from 'prop-types';

import { Editor } from '../';
import { EditorOnReadyContext } from './editor-context';

import { PortalRenderer, PortalProviderAPI } from './portal';

const LOG = true;

function log(...args) {
  if (LOG) console.log(...args);
}

export class ReactEditor extends React.PureComponent {
  state = {
    editorKey: 0,
  };
  portalProviderAPI = new PortalProviderAPI();

  get options() {
    const defaultOptions = {
      id: 'ReactEditor-wrapper',
      renderNodeView: this.renderNodeView,
      destroyNodeView: this.destroyNodeView,
      content: this.props.content,
    };
    return Object.assign({}, defaultOptions, this.props.options);
  }

  componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    if (this.props.content !== prevProps.content) {
      console.log('Content not same, creating a new Editor');
      this.setState((state) => ({
        editorKey: state.editorKey + 1,
      }));
    }
  }

  componentWillUnmount() {
    this.portalProviderAPI.destroy();
    this.portalProviderAPI = null;
  }

  // called from custom-node-view.js#renderComp
  renderNodeView = ({ dom, extension, renderingPayload }) => {
    if (!extension.render.displayName) {
      extension.render.displayName = `ParentNodeView[${extension.name}]`;
    }
    this.portalProviderAPI.render(extension.render, renderingPayload, dom);
  };

  destroyNodeView = (dom) => {
    log('removing nodeView dom');
    this.portalProviderAPI.remove(dom);
  };

  render() {
    return (
      <EditorWrapper
        // This allows us to let react handle creating destroying Editor
        key={this.state.editorKey}
        portalProviderAPI={this.portalProviderAPI}
        editorOptions={this.options}
      />
    );
  }
}

class EditorWrapper extends React.Component {
  static contextType = EditorOnReadyContext;
  editorRenderTarget = React.createRef();

  componentDidMount() {
    this.setupEditor();
  }

  setupEditor() {
    const { editorOptions } = this.props;
    const node = this.editorRenderTarget.current;
    if (node) {
      this.editor = new Editor(node, editorOptions);
      if (editorOptions.devtools) {
        applyDevTools(this.editor.view);
        window.editor = this.editor;
      }

      // TODO look into this?
      this.context.onEditorReady(this.editor);
      this.editor.focus();
    }
  }

  destroyEditor() {
    log('Unmounting react-editor');
    // When editor is destroyed it takes care  of calling destroyNodeView
    this.editor && this.editor.destroy();
    this.editor = undefined;
  }

  componentWillUnmount() {
    log('PortalRendererWrapper unmounting');
    this.destroyEditor();
  }

  render() {
    return (
      <>
        <div ref={this.editorRenderTarget} id={this.props.editorOptions.id} />
        {this.editorRenderTarget?.current ? (
          <PortalRenderer portalProviderAPI={this.props.portalProviderAPI} />
        ) : null}
      </>
    );
  }
}

EditorWrapper.propTypes = {
  portalProviderAPI: PropTypes.object.isRequired,
  editorOptions: PropTypes.object.isRequired,
};