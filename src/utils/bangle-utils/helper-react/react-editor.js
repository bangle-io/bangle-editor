import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import debounce from 'lodash.debounce';

import { Editor } from '../';
import { EditorOnReadyContext } from './editor-context';

import { PortalProviderAPI } from './portal';
import { getIdleCallback } from '../utils/js-utils';

const LOG = true;

function log(...args) {
  if (LOG) console.log('react-editor.js', ...args);
}

export class ReactEditor extends React.PureComponent {
  state = {
    editorKey: 0,
  };

  componentDidUpdate(prevProps) {
    if (this.props.content !== prevProps.content) {
      log('Content not same, creating a new Editor');
      this.setState((state) => ({
        editorKey: state.editorKey + 1,
      }));
    }
  }

  render() {
    return (
      <PortalWrapper>
        {(renderNodeView, destroyNodeView) => (
          <PMEditorWrapper
            // This allows us to let react handle creating destroying Editor
            key={this.state.editorKey}
            editorOptions={this.props.options}
            content={this.props.content}
            renderNodeView={renderNodeView}
            destroyNodeView={destroyNodeView}
          />
        )}
      </PortalWrapper>
    );
  }
}

class PortalWrapper extends React.PureComponent {
  portalProviderAPI = new PortalProviderAPI();
  state = {
    counter: 0,
  };

  componentWillUnmount() {
    this.portalProviderAPI.destroy();
    this.portalProviderAPI = null;
  }

  // called from custom-node-view.js#renderComp
  renderNodeView = ({ dom, extension, renderingPayload }) => {
    if (this.portalProviderAPI.render({ dom, extension, renderingPayload })) {
      log('asking to rerender due to renderNodeView');
      this.rerender();
    }
  };

  destroyNodeView = (dom) => {
    if (this.portalProviderAPI.remove(dom)) {
      log('removing nodeView dom');
      this.rerender();
    }
  };

  // TODO investigate if this can cause problems
  //    - explore if debounce only when portalProviderAPI.size > LARGE_SIZE
  //    - investigate the waitTime
  rerender = debounce(
    () => {
      log('rerendering by state change');
      this.setState((state) => ({ counter: state.counter + 1 }));
    },
    8,
    {
      trailing: true,
      leading: true,
      maxWait: 20,
    },
  );

  render() {
    log('rendering portal comp');
    return (
      <>
        {this.portalProviderAPI.getPortals()}
        {this.props.children(this.renderNodeView, this.destroyNodeView)}
      </>
    );
  }
}

class PMEditorWrapper extends React.Component {
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
  async componentDidMount() {
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
        window.editor = this.editor;

        getIdleCallback(() => {
          import(
            /* webpackChunkName: "prosemirror-dev-tools" */ 'prosemirror-dev-tools'
          ).then(({ default: applyDevTools }) => {
            applyDevTools(this.editor.view);
          });
        });
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
    log('rendering PMEditorWrapper');
    return (
      <div ref={this.editorRenderTarget} id={this.props.editorOptions.id} />
    );
  }
}
