import React from 'react';
import PropTypes from 'prop-types';

import { EditorOnReadyContext } from './editor-context';

import { PortalProviderAPI } from './portal';
import { getIdleCallback, smartDebounce } from '../utils/js-utils';
import { prosemirrorSetup, focusView } from '../editor';

const LOG = false;

function log(...args) {
  if (LOG) {
    console.log('react-editor2.js', ...args);
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
  renderNodeView = ({ dom, spec, renderingPayload }) => {
    if (this.portalProviderAPI.render({ dom, spec, renderingPayload })) {
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
      // Since this can be called after editor is unmounted
      this.portalProviderAPI &&
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
      // TODO fix this mess
      // new BangleEditor({
      //   loaders: [],
      //   plugins: [],
      //   spec: [],
      // });
      const view = prosemirrorSetup(node, {
        ...options,
        renderNodeView,
        destroyNodeView,
      });
      this.view = view;

      if (options.onReady) {
        options.onReady(view);
      }

      if (options.devtools) {
        window.editorView = view;
        getIdleCallback(() => {
          import(
            /* webpackChunkName: "prosemirror-dev-tools" */ 'prosemirror-dev-tools'
          ).then((args) => {
            this.devtools = args.applyDevTools(view);
          });
        });
      }
    }
  }

  componentWillUnmount() {
    log('EditorComp unmounting');
    // When editor is destroyed it takes care  of calling destroyNodeView
    this.view && this.view.destroy();
    if (this.props.options.devtools && this.devtools) {
      this.devtools();
    }
    if (window.editorView) {
      window.editorView = null;
    }
  }

  render() {
    log('rendering PMEditorWrapper');
    return (
      <>
        <div
          ref={this.editorRenderTarget}
          id={this.props.options.id}
          data-testid={this.props.options.testId}
        />
      </>
    );
  }
}
