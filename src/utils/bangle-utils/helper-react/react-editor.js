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
    if (this.props.content !== prevProps.content) {
      log('Content not same, creating a new Editor');
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
    if (this.portalProviderAPI.render({ dom, extension, renderingPayload })) {
      this.rerender();
    }
  };

  destroyNodeView = (dom) => {
    log('removing nodeView dom');
    if (this.portalProviderAPI.remove(dom)) {
      this.rerender();
    }
  };

  rerender = () => {
    this.setState((state) => ({ counter: state.counter + 1 }));
  };

  render() {
    return (
      <>
        {this.portalProviderAPI.getPortals()}
        <EditorComp
          // This allows us to let react handle creating destroying Editor
          key={this.state.editorKey}
          editorOptions={this.props.options}
          content={this.props.content}
          renderNodeView={this.renderNodeView}
          destroyNodeView={this.destroyNodeView}
        />
      </>
    );
  }
}

class EditorComp extends React.Component {
  static contextType = EditorOnReadyContext;
  static propTypes = {
    editorOptions: PropTypes.object.isRequired,
    content: PropTypes.object.isRequired,
    renderNodeView: PropTypes.func.isRequired,
    destroyNodeView: PropTypes.func.isRequired,
  };
  editorRenderTarget = React.createRef();
  shouldComponentUpdate() {
    return false;
  }
  componentDidMount() {
    const {
      editorOptions,
      content,
      renderNodeView,
      destroyNodeView,
    } = this.props;
    const node = this.editorRenderTarget.current;
    if (node) {
      this.editor = new Editor(node, {
        ...editorOptions,
        content,
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
    }
  }

  componentWillUnmount() {
    log('EditorComp unmounting');
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
    log('rendering EditorComp');
    return (
      <div ref={this.editorRenderTarget} id={this.props.editorOptions.id} />
    );
  }
}
