const LOG = true;

function log(...args) {
  if (LOG) console.log('customer-node-view.js', ...args);
}
export class CustomNodeView {
  constructor({
    node,
    view,
    getPos,
    decorations,
    extension,
    renderNodeView,
    destroyNodeView,
  }) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.extension = extension;
    this.decorations = decorations;
    // Note it is important that we not set contentDOM for leaf nodes
    // as it causes silent bugs
    this._getContentDOM = extension.options.getContentDOM;
    this._createDomRef = extension.options.createDomRef;
    this._viewShouldUpdate = extension.options.viewShouldUpdate;
    this._renderNodeView = renderNodeView;
    this._destroyNodeView = destroyNodeView;
    this.init();
  }

  init() {
    if (typeof this.node.attrs['data-type'] !== 'string') {
      throw new Error(`NodeView:${this.extension.name} must have a data-type`);
    }

    this.domRef = this.createDomRef();
    this.setDomAttrs(this.node, this.domRef); // copied from atlas's reactnodeview
    const { dom: contentDOMWrapper, contentDOM } = this.getContentDOM();

    if (this.domRef && contentDOMWrapper) {
      this.domRef.appendChild(contentDOMWrapper);
      this.contentDOM = contentDOM ? contentDOM : contentDOMWrapper;
      this.contentDOMWrapper = contentDOMWrapper || contentDOM;
    }

    // something gets messed up during mutation processing inside of a
    // nodeView if DOM structure has nested plain "div"s, it doesn't see the
    // difference between them and it kills the nodeView
    this.domRef.classList.add(`${this.node.type.name}-NodeView-Wrap`); // Do we need this?
    log('init');
    this.renderComp();
  }

  // PM methods
  get dom() {
    return this.domRef;
  }

  // prevent a full re-render of the vue component on update
  // we'll handle prop updates in `update()`
  // TODO look into this -- allow nodeViews to change this
  ignoreMutation(mutation) {
    // allow leaf nodes to be selected
    if (mutation.type === 'selection') {
      return false;
    }

    if (!this.contentDOM) {
      return true;
    }
    return !this.contentDOM.contains(mutation.target);
  }

  update(node) {
    // @see https://github.com/ProseMirror/prosemirror/issues/648
    const isValidUpdate = this.node.type === node.type; // && validUpdate(this.node, node);

    if (!isValidUpdate) {
      return false;
    }

    if (this.domRef && !this.node.sameMarkup(node)) {
      this.setDomAttrs(node, this.domRef); // TODO is this actually doing anything ? copied from atlasian
    }

    this.node = node;
    // View should not process a re-render if this is false.
    // We dont want to destroy the view, so we return true.
    if (!this.viewShouldUpdate(node)) {
      return true;
    }

    log('update');
    this.renderComp();

    return true;
  }

  viewShouldUpdate(nextNode) {
    if (this._viewShouldUpdate) {
      return this._viewShouldUpdate(nextNode);
    }

    return true;
  }

  destroy() {
    if (!this.domRef) {
      return;
    }
    log('destroy');
    this._destroyNodeView(this.domRef);
    this.domRef = undefined;
    this.contentDOM = undefined;
  }

  selectNode() {
    this.dom.classList.add('ProseMirror-selectednode');
    log('selectNode');
    this.renderComp({ selected: true });
  }

  deselectNode() {
    this.dom.classList.remove('ProseMirror-selectednode');
    log('deselectNode');
    this.renderComp({ selected: false });
  }

  // copied from atlasmk2
  setDomAttrs(node, element) {
    Object.keys(
      node.attrs || {
        'data-type': this.extension.name,
      },
    ).forEach((attr) => {
      element.setAttribute(attr, node.attrs[attr]);
    });
  }

  // from atlas expected that the person may implement
  createDomRef() {
    if (this._createDomRef) {
      return this._createDomRef();
    }

    return this.node.isInline
      ? document.createElement('span')
      : document.createElement('div');
  }

  // from atlas expected that the person may implement it different
  getContentDOM() {
    if (this._getContentDOM) {
      return this._getContentDOM();
    }

    return {
      dom: undefined,
      contentDOM: undefined,
    };
  }

  // gets called by the div grabbing this and using
  // it like render(props, forWardRef) => <div ref={forwardRef} />
  handleRef = (node) => {
    // React sends null node if unmounting
    if (!node) {
      log('empty node ');
      if (this.refNode) {
        const contentDOM = this.contentDOMWrapper || this.contentDOM;
        this.refNode.removeChild(contentDOM);
        this.refNode = null;
      }
      return;
    }
    if (!this._getContentDOM) {
      throw new Error('Not allowed as no content dom allowed');
    }

    const contentDOM = this.contentDOMWrapper || this.contentDOM;

    // move the contentDOM node inside the inner reference after rendering
    if (node && contentDOM && !node.contains(contentDOM)) {
      node.appendChild(contentDOM);
      this.refNode = node;
    }
    log('handleRef', node, contentDOM);
  };

  // from tiptap
  // can be used by node views to update state
  updateAttrs = (attrs) => {
    if (!this.view.editable) {
      return;
    }

    const { tr } = this.view.state;
    const nodePos = this.getPos();

    tr.setNodeMarkup(nodePos, undefined, {
      ...this.node.attrs,
      ...attrs,
      'data-type': this.extension.name, // this is important
    });

    this.view.dispatch(tr);
  };

  renderComp({ selected = false } = {}) {
    if (!this.domRef) {
      return;
    }

    log('rendering', this.contentDOM, this.dom);
    this._renderNodeView({
      renderingPayload: {
        node: this.node,
        view: this.view,
        handleRef: this.handleRef,
        updateAttrs: this.updateAttrs,
        selected: selected,
      },

      // for gluing with backend
      dom: this.domRef,
      extension: this.extension,
    });
  }
}
