const LOG = true;

let log = LOG ? console.log.bind(console, 'node-view') : () => {};

class BaseNodeView {
  get _pmProps() {
    return {
      node: this._node,
      view: this._view,
      getPos: this._getPos,
      decorations: this._decorations,
      selected: this._selected,
    };
  }

  // for pm
  get dom() {
    return this._containerDOM;
  }
  get contentDOM() {
    return this._contentDOM;
  }

  constructor(
    {
      node,
      view,
      getPos,
      decorations,
      containerDOM,
      contentDOM,
      update = () => {},
      destroy = () => {},
    },
    { selectionSensitive = true } = {},
  ) {
    // by PM
    this._node = node;
    this._view = view;
    this._getPos = getPos;
    this._decorations = decorations;

    // by the implementor
    this._containerDOM = containerDOM;
    this._contentDOM = contentDOM;

    // options
    this.opts = {
      selectionSensitive,
    };

    // handlers
    this.handlers = { update, destroy };
    this.handlers.update.call(this, this._pmProps);
  }
}

export class NodeView extends BaseNodeView {
  update(node, decorations) {
    log('update node');
    // @see https://github.com/ProseMirror/prosemirror/issues/648
    if (this._node.type !== node.type) {
      return false;
    }

    if (this._node === node && this._decorations === decorations) {
      log('update node no change');

      return true;
    }

    this._node = node;
    this._decorations = decorations;
    log('update node execute');
    this.handlers.update.call(this, this._pmProps);

    return true;
  }

  selectNode() {
    this._containerDOM.classList.add('ProseMirror-selectednode');
    this._selected = true;
    log('select node');
    this.handlers.update.call(this, this._pmProps);
  }

  deselectNode() {
    this._containerDOM.classList.remove('ProseMirror-selectednode');
    this._selected = false;
    log('deselectNode node');
    this.handlers.update.call(this, this._pmProps);
  }

  setSelection(...args) {
    console.log('hi', ...args);
  }

  ignoreMutation(mutation) {
    console.log({ mutation });
    // allow leaf nodes to be selected
    if (mutation.type === 'selection') {
      return false;
    }

    if (!this.contentDOM) {
      return true;
    }
    return !this.contentDOM.contains(mutation.target);
  }

  // stopEvent() {
  //   return true;
  // }

  destroy() {
    this.handlers.destroy.call(this, this._pmProps);
    this._containerDOM = undefined;
    this._contentDOM = undefined;
  }
}

function updateAttrs(pos, node, newAttrs, tr) {
  return tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    ...newAttrs,
  });
}
