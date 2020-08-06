import React from 'react';
import applyDevTools from 'prosemirror-dev-tools';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
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
    counter: 0,
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
      <>
        {this.portalProviderAPI.getPortals()}
        <PortalRenderer
          // This allows us to let react handle creating destroying Editor
          key={this.state.editorKey}
          portalProviderAPI={this.portalProviderAPI}
          editorOptions={{
            ...this.props.options,
            content: this.props.content,
          }}
          renderNodeView={this.renderNodeView}
          destroyNodeView={this.destroyNodeView}
          rerender={() => {
            this.setState((state) => ({ counter: state.counter + 1 }));
          }}
        />
      </>
    );
  }
}

class PortalRenderer extends React.Component {
  static contextType = EditorOnReadyContext;
  editorRenderTarget = React.createRef();

  componentDidMount() {
    const { editorOptions, renderNodeView, destroyNodeView } = this.props;
    const node = this.editorRenderTarget.current;
    if (node) {
      this.editor = new Editor(node, {
        ...editorOptions,
        renderNodeView,
        destroyNodeView,
      });
      if (editorOptions.devtools) {
        applyDevTools(this.editor.view);
        window.editor = this.editor;
      }
      // TODO look into this?
      this.context.onEditorReady(this.editor);
      this.editor.focus();
      this.props.rerender();
    }

    this.props.portalProviderAPI.on('#root_update', this.handleForceUpdate);
    this.props.portalProviderAPI.on('#force_update', this.handleForceUpdate);
  }

  handleForceUpdate = () => {
    log('force update');
    this.props.rerender();
  };

  componentWillUnmount() {
    log('PortalRendererWrapper unmounting');
    this.props.portalProviderAPI.off('#force_update', this.handleForceUpdate);
    this.props.portalProviderAPI.off('#root_update', this.handleForceUpdate);
    // When editor is destroyed it takes care  of calling destroyNodeView
    this.editor && this.editor.destroy();
    if (this.props.editorOptions.devtools) {
      const DEVTOOLS_CLASS_NAME = '__prosemirror-dev-tools__';
      let place = document.querySelector(`.${DEVTOOLS_CLASS_NAME}`);
      if (place) {
        console.log('unmounting');
        ReactDOM.unmountComponentAtNode(place);
        place.innerHTML = '';
      }
    }
    this.editor = undefined;
    window.editor = null;
  }

  render() {
    log('rendering portals');
    return (
      <div ref={this.editorRenderTarget} id={this.props.editorOptions.id} />
    );
  }
}

PortalRenderer.propTypes = {
  portalProviderAPI: PropTypes.object.isRequired,
  editorOptions: PropTypes.object.isRequired,
};
