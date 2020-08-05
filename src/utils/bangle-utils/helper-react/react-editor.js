import React from 'react';
import applyDevTools from 'prosemirror-dev-tools';
import PropTypes from 'prop-types';

import { Editor } from '../';
import { EditorOnReadyContext } from './editor-context';

import { PortalProviderAPI } from './portal';

const LOG = true;

function log(...args) {
  if (LOG) console.log('react-editor.js', ...args);
}

export class ReactEditor extends React.PureComponent {
  state = {
    editorKey: 0,
  };
  portalProviderAPI = new PortalProviderAPI();

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

  render() {
    return (
      <PortalRenderer
        // This allows us to let react handle creating destroying Editor
        key={this.state.editorKey}
        portalProviderAPI={this.portalProviderAPI}
        editorOptions={{
          ...this.props.options,
          content: this.props.content,
        }}
      />
    );
  }
}

class PortalRenderer extends React.Component {
  static contextType = EditorOnReadyContext;
  editorRenderTarget = React.createRef();
  state = {
    counter: 0,
  };
  componentDidMount() {
    const { editorOptions } = this.props;
    const node = this.editorRenderTarget.current;
    if (node) {
      this.editor = new Editor(node, {
        ...editorOptions,
        renderNodeView: this.renderNodeView,
        destroyNodeView: this.destroyNodeView,
      });
      if (editorOptions.devtools) {
        applyDevTools(this.editor.view);
        window.editor = this.editor;
      }
      // TODO look into this?
      this.context.onEditorReady(this.editor);
      this.editor.focus();
    }

    this.props.portalProviderAPI.on('#root_update', this.handleForceUpdate);
    this.props.portalProviderAPI.on('#force_update', this.handleForceUpdate);
  }

  // called from custom-node-view.js#renderComp
  renderNodeView = ({ dom, extension, renderingPayload }) => {
    if (!extension.render.displayName) {
      extension.render.displayName = `ParentNodeView[${extension.name}]`;
    }
    this.props.portalProviderAPI.render(
      extension.render,
      renderingPayload,
      dom,
    );
  };

  destroyNodeView = (dom) => {
    log('removing nodeView dom');
    this.props.portalProviderAPI.remove(dom);
  };

  handleForceUpdate = () => {
    log('force update');
    this.setState((state) => ({ counter: state.counter + 1 }));
  };

  componentWillUnmount() {
    log('PortalRendererWrapper unmounting');
    this.props.portalProviderAPI.off('#force_update', this.handleForceUpdate);
    this.props.portalProviderAPI.off('#root_update', this.handleForceUpdate);
    // When editor is destroyed it takes care  of calling destroyNodeView
    this.editor && this.editor.destroy();
    this.editor = undefined;
  }

  render() {
    log('rendering portals');
    return (
      <>
        <div ref={this.editorRenderTarget} id={this.props.editorOptions.id} />
        {this.editorRenderTarget?.current
          ? this.props.portalProviderAPI.getPortals()
          : null}
      </>
    );
  }
}

PortalRenderer.propTypes = {
  portalProviderAPI: PropTypes.object.isRequired,
  editorOptions: PropTypes.object.isRequired,
};
