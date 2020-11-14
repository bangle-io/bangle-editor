import { Plugin } from 'prosemirror-state';
import { objectFilter, bangleWarn, createElement } from './utils/js-utils';
const LOG = false;

let log = LOG ? console.log.bind(console, 'node-view') : () => {};
const renderHandlersCache = new WeakMap();

class BaseNodeView {
  getAttrs() {
    return this._node.attrs;
  }

  getNodeViewProps() {
    return {
      node: this._node,
      view: this._view,
      getPos: this._getPos,
      decorations: this._decorations,
      selected: this._selected,
      attrs: this._node.attrs,
      updateAttrs: (attrs) => {
        this._view.dispatch(
          updateAttrs(this._getPos(), this._node, attrs, this._view.state.tr),
        );
        return true;
      },
    };
  }

  // for pm to get hold of containerDOM
  // this exists as the name `dom` is too ambiguous
  get dom() {
    return this.containerDOM;
  }

  constructor(
    {
      node,
      view,
      getPos,
      decorations,
      containerDOM,
      contentDOM,
      mountDOM,
      // Defaults to whatever is set by the rendering framework which ideally
      // would have called the method `saveRenderHandlers` before this gets
      // executed.
      renderHandlers = getRenderHandlers(view),
    },
    { selectionSensitive = true } = {},
  ) {
    // by PM
    this._node = node;
    this._view = view;
    this._getPos = getPos;
    this._decorations = decorations;
    this._selected = false;

    if (!renderHandlers) {
      bangleWarn(
        'It appears the view =',
        view,
        ' was not associated with renderHandlers. You are either using nodeViews accidentally or have incorrectly setup nodeViews',
      );
      throw new Error(
        'You either did not pass the renderHandlers correct or it cannot find render handlers associated with the view.',
      );
    }

    this.renderHandlers = renderHandlers;

    // by the implementor
    this.containerDOM = containerDOM;
    this.contentDOM = contentDOM;
    this.mountDOM = mountDOM || containerDOM; // for ui libraries to mount

    // options
    this.opts = {
      selectionSensitive,
    };

    this.renderHandlers.create(this, this.getNodeViewProps());
  }
}

export class NodeView extends BaseNodeView {
  /**
   *
   */
  static createPlugin({
    name,
    containerDOM: containerDOMSpec,
    contentDOM: contentDOMSpec,
    renderHandlers,
  }) {
    return new Plugin({
      props: {
        nodeViews: {
          [name]: (node, view, getPos, decorations) => {
            const containerDOM = createElement(containerDOMSpec);

            let contentDOM;
            if (contentDOMSpec) {
              contentDOM = createElement(contentDOMSpec);
            }

            return new NodeView({
              node,
              view,
              getPos,
              decorations,
              containerDOM,
              contentDOM,
              renderHandlers,
            });
          },
        },
      },
    });
  }

  update(node, decorations) {
    log('update node');
    // https://github.com/ProseMirror/prosemirror/issues/648
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
    this.renderHandlers.update(this, this.getNodeViewProps());

    return true;
  }

  selectNode() {
    this.containerDOM.classList.add('ProseMirror-selectednode');
    this._selected = true;
    log('select node');
    this.renderHandlers.update(this, this.getNodeViewProps());
  }

  deselectNode() {
    this.containerDOM.classList.remove('ProseMirror-selectednode');
    this._selected = false;
    log('deselectNode node');
    this.renderHandlers.update(this, this.getNodeViewProps());
  }

  // Donot unset it if you donot have an implmentation.
  // Unsetting this is dangerous as it fucks up elements who have editable content inside them.
  // setSelection(...args) {
  //   console.log('hi', ...args);
  // }

  ignoreMutation(mutation) {
    // TODO do we need this
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
    this.renderHandlers.destroy(this, this.getNodeViewProps());
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
          // todo move this to bangle-name
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
  if (renderHandlersCache.has(editorContainer)) {
    throw new Error(
      'It looks like renderHandlers were already set by someone else.',
    );
  }
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

function updateAttrs(pos, node, newAttrs, tr) {
  return tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    ...newAttrs,
  });
}
