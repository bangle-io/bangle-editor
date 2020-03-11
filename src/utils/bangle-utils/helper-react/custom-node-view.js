export class CustomNodeView {
  constructor({
    node,
    view,
    getPos,
    extension,
    renderNodeView,
    destroyNodeView,
    wrapperElement,
  }) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.extension = extension;
    this.wrapperElement = wrapperElement;
    // Note it is important that we not set contentDOM for leaf nodes
    // as it causes silent bugs
    this.setContentDOM = Boolean(extension.options.nodeViewSetContentDOM);
    this._renderNodeView = renderNodeView;
    this._destroyNodeView = destroyNodeView;
    this.init();
  }

  // PM methods
  get dom() {
    return this.domRef;
  }

  // prevent a full re-render of the vue component on update
  // we'll handle prop updates in `update()`
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
      this.setDomAttrs(node, this.domRef); // TODO is this actually doing anything ? copied from atlask
    }

    this.node = node;
    this.renderComp();

    return true;
  }

  destroy() {
    if (!this.domRef) {
      return;
    }

    this._destroyNodeView(this.domRef);
    this.domRef = undefined;
    this.contentDOM = undefined;
  }

  selectNode() {
    this.dom.classList.add('ProseMirror-selectednode');
    this.renderComp({ selected: true });
  }

  deselectNode() {
    this.dom.classList.remove('ProseMirror-selectednode');
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
    if (this.wrapperElement) {
      return document.createElement(this.wrapperElement);
    }

    return this.node.isInline
      ? document.createElement('span')
      : document.createElement('div');
  }

  // from atlas expected that the person may implement it differentyl
  getContentDOM() {
    return this.setContentDOM ? document.createElement('div') : null;
  }

  // gets called by the div grabbing this and using
  // it like render(props, forWardRef) => <div ref={forwardRef} />
  handleRef = (node) => {
    if (!this.setContentDOM) {
      throw new Error('Not allowed as no content dom allowed');
    }

    const contentDOM = this.contentDOM;
    // move the contentDOM node inside the inner reference after rendering
    if (node && contentDOM && !node.contains(contentDOM)) {
      node.appendChild(contentDOM);
    }
    this.contentDOM = node;
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

  init() {
    if (typeof this.node.attrs['data-type'] !== 'string') {
      throw new Error(`NodeView:${this.extension.name} must have a data-type`);
    }

    this.domRef = this.createDomRef();
    this.setDomAttrs(this.node, this.domRef); // copied from atlas's reactnodeview
    const contentDOM = this.getContentDOM();

    if (this.domRef && contentDOM) {
      this.domRef.appendChild(contentDOM);
      this.contentDOM = contentDOM;
    }

    // something gets messed up during mutation processing inside of a
    // nodeView if DOM structure has nested plain "div"s, it doesn't see the
    // difference between them and it kills the nodeView
    this.domRef.classList.add(`${this.node.type.name}NodeView-Wrap`); // Do we need this?
    this.renderComp();
  }

  renderComp({ selected = false } = {}) {
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
