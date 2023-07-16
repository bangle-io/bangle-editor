import {
  Decoration,
  DOMOutputSpec,
  EditorProps,
  EditorView,
  Node,
  Plugin,
  PluginKey,
  Transaction,
} from '@bangle.dev/pm';
import { bangleWarn } from '@bangle.dev/utils';

import { createElement } from './create-element';

const LOG = false;

let log = LOG ? console.log.bind(console, 'node-view') : () => {};
const renderHandlersCache: WeakMap<HTMLElement, RenderHandlers> = new WeakMap();

type GetPosFunction = () => number | undefined;

export type UpdateAttrsFunction = (attrs: Node['attrs']) => void;

export interface NodeViewProps {
  node: Node;
  view: EditorView;
  getPos: GetPosFunction;
  decorations: readonly Decoration[];
  selected: boolean;
  attrs: Node['attrs'];
  updateAttrs: UpdateAttrsFunction;
}

export type RenderHandlerFunction = (
  nodeView: NodeView,
  props: NodeViewProps,
) => void;

export interface RenderHandlers {
  create: RenderHandlerFunction;
  update: RenderHandlerFunction;
  destroy: RenderHandlerFunction;
}

abstract class BaseNodeView {
  contentDOM?: HTMLElement;
  containerDOM?: HTMLElement;
  renderHandlers: RenderHandlers;
  opts: { selectionSensitive: boolean };
  _decorations: readonly Decoration[];
  _getPos: GetPosFunction;
  _node: Node;
  _selected: boolean;
  _view: EditorView;

  // for pm to get hold of containerDOM
  constructor(
    {
      node,
      view,
      getPos,
      decorations,
      containerDOM,
      contentDOM,
      // Defaults to whatever is set by the rendering framework which ideally
      // would have called the method `saveRenderHandlers` before this gets
      // executed.
      renderHandlers = getRenderHandlers(view),
    }: {
      node: Node;
      view: EditorView;
      getPos: GetPosFunction;
      decorations: readonly Decoration[];
      contentDOM?: HTMLElement;
      containerDOM?: HTMLElement;
      renderHandlers?: RenderHandlers;
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

    if (this.contentDOM) {
      // This css rule makes sure the content dom has non-zero width
      // so that folks can type inside it
      this.contentDOM.classList.add('bangle-nv-content');
    }

    if (this.containerDOM) {
      this.containerDOM.classList.add('bangle-nv-container');
    }

    if (this._node.type.isAtom && this.contentDOM) {
      throw new Error('An atom node cannot have a contentDOM');
    }

    this.opts = {
      selectionSensitive,
    };

    this.renderHandlers.create(
      this as unknown as NodeView,
      this.getNodeViewProps(),
    );
  }

  // this exists as the name `dom` is too ambiguous
  get dom(): InstanceType<typeof window.Node> {
    return this.containerDOM!;
  }

  getAttrs(): Node['attrs'] {
    return this._node.attrs;
  }

  getNodeViewProps(): NodeViewProps {
    return {
      node: this._node,
      view: this._view,
      getPos: this._getPos,
      decorations: this._decorations,
      selected: this._selected,
      attrs: this._node.attrs,
      updateAttrs: (attrs: Node['attrs']) => {
        this._view.dispatch(
          updateAttrs(this._getPos(), this._node, attrs, this._view.state.tr),
        );
      },
    };
  }
}
// TODO this is adds unneeded abstraction
//    maybe we can lessen the amount of things it is doing
//    and the abstraction.
export class NodeView extends BaseNodeView {
  /**
   * The idea here is to figure out whether your component
   * will be hole-y (will let pm put in contents) or be opaque (example emoji).
   * NOTE: if  passing contentDOM, it is your responsibility to insert it into
   * containerDOM.
   * NOTE: when dealing with renderHandlers like .create or .update
   * donot assume anything about the current state of dom elements. For
   * example, the dom you created in .create handler, may or may not exist,
   * when the .update is called.
   *
   */
  static createPlugin({
    name,
    containerDOM: containerDOMSpec,
    contentDOM: contentDOMSpec, // only for components which need to have editable content
    renderHandlers,
  }: {
    name: string;
    contentDOM?: DOMOutputSpec;
    containerDOM: DOMOutputSpec;
    renderHandlers?: RenderHandlers;
  }) {
    return new Plugin({
      key: new PluginKey(name + 'NodeView'),
      props: {
        nodeViews: {
          [name]: (node, view, getPos, decorations) => {
            const containerDOM = createElement(containerDOMSpec);

            let contentDOM;
            if (contentDOMSpec) {
              contentDOM = createElement(contentDOMSpec);
            }

            // getPos for custom marks is boolean
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
        } as EditorProps['nodeViews'],
      },
    });
  }

  deselectNode() {
    this.containerDOM!.classList.remove('ProseMirror-selectednode');
    this._selected = false;
    log('deselectNode node');
    this.renderHandlers.update(this, this.getNodeViewProps());
  }

  // }
  destroy() {
    this.renderHandlers.destroy(this, this.getNodeViewProps());
    this.containerDOM = undefined;
    this.contentDOM = undefined;
  }

  // PM essentially works by watching mutation and then syncing the two states: its own and the DOM.
  ignoreMutation(
    mutation:
      | MutationRecord
      | {
          type: 'selection';
          target: Element;
        },
  ) {
    // For PM an atom node is a black box, what happens inside it are of no concern to PM
    // and should be ignored.
    if (this._node.type.isAtom) {
      return true;
    }

    // donot ignore a selection type mutation
    if (mutation.type === 'selection') {
      return false;
    }

    // if a child of containerDOM (the one handled by PM)
    // has any mutation, do not ignore it
    if (this.containerDOM!.contains(mutation.target)) {
      return false;
    }

    // if the contentDOM itself was the target
    // do not ignore it. This is important for schema where
    // content: 'inline*' and you end up delete all the content with backspace
    // PM needs to step in and create an empty node.
    if (mutation.target === this.contentDOM) {
      return false;
    }

    return true;
  }

  selectNode() {
    this.containerDOM!.classList.add('ProseMirror-selectednode');
    this._selected = true;
    log('select node');
    this.renderHandlers.update(this, this.getNodeViewProps());
  }

  update(node: Node, decorations: readonly Decoration[]) {
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

  // Donot unset it if you donot have an implementation.
  // Unsetting this is dangerous as it fucks up elements who have editable content inside them.
  // setSelection(...args) {
  //   console.log('hi', ...args);
  // }

  // stopEvent() {
  //   return true;
}

export function saveRenderHandlers(
  editorContainer: HTMLElement,
  handlers: RenderHandlers,
) {
  if (renderHandlersCache.has(editorContainer)) {
    throw new Error(
      'It looks like renderHandlers were already set by someone else.',
    );
  }
  renderHandlersCache.set(editorContainer, handlers);
}

export function getRenderHandlers(view: EditorView) {
  // TODO this assumes parentNode is one level above root
  //   lets make sure it always is or rewrite this to
  //    traverse the ancestry.
  let editorContainer = view.dom.parentNode as HTMLElement;
  const handlers = renderHandlersCache.get(editorContainer);
  return handlers;
}

function updateAttrs(
  pos: number | undefined,
  node: Node,
  newAttrs: Node['attrs'],
  tr: Transaction,
) {
  if (pos === undefined) {
    return tr;
  }
  return tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    ...newAttrs,
  });
}
