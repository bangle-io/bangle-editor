import React from 'react';
import PropTypes from 'prop-types';

import { EditorOnReadyContext } from './editor-context';

import { PortalProviderAPI } from './portal';
import { getIdleCallback, smartDebounce } from '../utils/js-utils';
import { Editor } from 'bangle-core/editor';

const LOG = false;

function log(...args) {
  if (LOG) {
    console.log('react-editor.js', ...args);
  }
}

export class ReactEditor extends React.PureComponent {
  static propTypes = {
    options: PropTypes.object.isRequired,
  };

  render() {
    return (
      <PortalWrapper>
        {(renderNodeView, destroyNodeView) => (
          <PMEditorWrapper
            // This allows us to let react handle creating destroying Editor
            options={this.props.options}
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
    if (this.portalProviderAPI?.remove(dom)) {
      log('removing nodeView dom');
      this.rerender();
    }
  };

  // TODO investigate if this can cause problems
  //    - explore if debounce only when portalProviderAPI.size > LARGE_SIZE
  //    - investigate the waitTime
  rerender = smartDebounce(
    () => {
      log('rerendering by state change');
      this.setState((state) => ({ counter: state.counter + 1 }));
    },
    100,
    20,
    {
      trailing: true,
      leading: true,
      maxWait: 50,
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
    options: PropTypes.object.isRequired,
    renderNodeView: PropTypes.func.isRequired,
    destroyNodeView: PropTypes.func.isRequired,
  };
  editorRenderTarget = React.createRef();
  devtools;
  shouldComponentUpdate() {
    return false;
  }
  async componentDidMount() {
    const { options, renderNodeView, destroyNodeView } = this.props;
    const node = this.editorRenderTarget.current;
    if (node) {
      const onInit = ({ view, state, editor }) => {
        this.context.onEditorReady(editor);
        editor.focus();
        if (options.onInit) {
          options.onInit({ view, state, editor });
        }
        if (options.devtools) {
          window.editor = editor;
          getIdleCallback(() => {
            import(
              /* webpackChunkName: "prosemirror-dev-tools" */ 'prosemirror-dev-tools'
            ).then((args) => {
              this.devtools = args.applyDevTools(view);
            });
          });
        }
      };
      // TODO fix this mess
      this.editor = new Editor(node, {
        ...options,
        renderNodeView,
        destroyNodeView,
        onInit,
      });
    }
  }

  componentWillUnmount() {
    log('EditorComp unmounting');
    // When editor is destroyed it takes care  of calling destroyNodeView
    this.editor && this.editor.destroy();
    if (this.props.options.devtools && this.devtools) {
      this.devtools();
    }
    if (window.editor) {
      window.editor = null;
    }
  }

  render() {
    log('rendering PMEditorWrapper');
    return <div ref={this.editorRenderTarget} id={this.props.options.id} />;
  }
}
