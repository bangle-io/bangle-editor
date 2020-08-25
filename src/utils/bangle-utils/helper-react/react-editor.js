import React from 'react';
import PropTypes from 'prop-types';

import { Editor } from '../';
import { EditorOnReadyContext } from './editor-context';

import { PortalProviderAPI } from './portal';
import { getIdleCallback, smartDebounce } from '../utils/js-utils';
import { CollabEditor } from '../../../plugins/collab/client/CollabClient';

const LOG = false;

function log(...args) {
  if (LOG) console.log('react-editor.js', ...args);
}

export class ReactEditor extends React.PureComponent {
  state = {
    editorKey: 0,
  };

  componentDidUpdate(prevProps) {
    // if (this.props.content !== prevProps.content) {
    //   log('Content not same, creating a new Editor');
    //   this.setState((state) => ({
    //     editorKey: state.editorKey + 1,
    //   }));
    // }
    if (this.props.docName !== prevProps.docName) {
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
            docName={this.props.docName}
            manager={this.props.manager}
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
    manager: PropTypes.object,
    docName: PropTypes.string,
    editorOptions: PropTypes.object.isRequired,
    content: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    //   .isRequired,
    renderNodeView: PropTypes.func.isRequired,
    destroyNodeView: PropTypes.func.isRequired,
  };
  editorRenderTarget = React.createRef();
  devtools;
  shouldComponentUpdate() {
    return false;
  }
  async componentDidMount() {
    const {
      editorOptions,
      content,
      renderNodeView,
      destroyNodeView,
      docName,
      manager,
    } = this.props;
    const node = this.editorRenderTarget.current;
    if (node) {
      let editor;
      const onInit = ({ view, state, editor }) => {
        this.context.onEditorReady(editor);
        editor.focus();
        if (editorOptions.onInit) {
          editorOptions.onInit({ view, state, editor });
        }
        if (editorOptions.devtools) {
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
      if (!manager) {
        editor = new Editor(node, {
          ...editorOptions,
          content,
          renderNodeView,
          destroyNodeView,
          onInit,
        });
      } else {
        ({ editor } = new CollabEditor(
          node,
          {
            ...editorOptions,
            // content,
            renderNodeView,
            destroyNodeView,
            onInit,
          },
          docName,
          manager,
        ));
      }
      this.editor = editor;
    }
  }

  componentWillUnmount() {
    log('EditorComp unmounting');
    // When editor is destroyed it takes care  of calling destroyNodeView
    this.editor && this.editor.destroy();
    if (this.props.editorOptions.devtools && this.devtools) {
      this.devtools();
    }
    this.editor = undefined;
    if (window.editor) {
      window.editor = null;
    }
  }

  render() {
    log('rendering PMEditorWrapper');
    return (
      <div ref={this.editorRenderTarget} id={this.props.editorOptions.id} />
    );
  }
}
