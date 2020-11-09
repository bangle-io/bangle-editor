import { objectFilter, bangleWarn } from './utils/js-utils';
const LOG = true;

let log = LOG ? console.log.bind(console, 'node-view') : () => {};
const renderHandlersCache = new WeakMap();

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

  // for pm to get hold of containerDOM
  // this exists as the name `dom` is too ambiguous
  get dom() {
    return this.containerDOM;
  }

  constructor(
    { node, view, getPos, decorations, containerDOM, contentDOM, mountDOM },
    { selectionSensitive = true } = {},
  ) {
    // by PM
    this._node = node;
    this._view = view;
    this._getPos = getPos;
    this._decorations = decorations;
    this._selected = false;

    this.renderHandlers = getRenderHandlers(view); // This is expected to be set by whatever rendering framework is instantiating bangle-editor
    if (!this.renderHandlers) {
      bangleWarn(
        'It appears the view =',
        view,
        ' was not associated with renderHandlers. You are either using nodeViews accidentally or have incorrectly setup nodeViews',
      );
      throw new Error('Cannot find render handlers for the view.');
    }

    // by the implementor
    this.containerDOM = containerDOM;
    this.contentDOM = contentDOM;
    this.mountDOM = mountDOM; // for ui libraries to mount

    // options
    this.opts = {
      selectionSensitive,
    };

    this.renderHandlers.create(this, this._pmProps);
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
    this.renderHandlers.update(this, this._pmProps);

    return true;
  }

  selectNode() {
    this.containerDOM.classList.add('ProseMirror-selectednode');
    this._selected = true;
    log('select node');
    this.renderHandlers.update(this, this._pmProps);
  }

  deselectNode() {
    this.containerDOM.classList.remove('ProseMirror-selectednode');
    this._selected = false;
    log('deselectNode node');
    this.renderHandlers.update(this, this._pmProps);
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
    this.renderHandlers.destroy(this, this._pmProps);
    // TODO do we need to cleanup mountDOM
    this.containerDOM = undefined;
    this.contentDOM = undefined;
  }
}

/**
 * @param {*} spec
 * @param {Object} opts
 * @param {string} opts.container
 */
export function serializationHelpers(
  spec,
  {
    allowedAttrs,
    container = spec.schema.inline ? 'span' : 'div',
    serializer = (node) =>
      JSON.stringify(
        allowedAttrs
          ? objectFilter(node.attrs, (value, key) => allowedAttrs.includes(key))
          : node.attrs,
      ),
    parser = (value) => JSON.parse(value),
  } = {},
) {
  // TODO need to make a hole
  return {
    toDOM: (node) => {
      return [
        container,
        {
          'data-bangle-id': spec.name,
          'data-bangle-attrs': serializer(node),
        },
      ];
    },
    parseDOM: [
      {
        tag: `${container}[data-bangle-id="${spec.name}"]`,
        getAttrs: (dom) => {
          const attrs = dom.getAttribute('data-bangle-attrs');
          if (!attrs) {
            return {};
          }
          return parser(attrs);
        },
      },
    ],
  };
}

export function saveRenderHandlers(editorContainer, handlers) {
  renderHandlersCache.set(editorContainer, handlers);
}

export function getRenderHandlers(view) {
  // TODO this assumes parentNode is one level above root
  //   lets make sure it always is or rewrite this to
  //    traverse the ancestry.
  let editorContainer = view.dom.parentNode;
  const handlers = renderHandlersCache.get(editorContainer);
  return handlers;
}

// function updateAttrs(pos, node, newAttrs, tr) {
//   return tr.setNodeMarkup(pos, undefined, {
//     ...node.attrs,
//     ...newAttrs,
//   });
// }
