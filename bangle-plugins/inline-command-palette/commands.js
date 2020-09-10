import { Fragment, Node } from 'prosemirror-model';
import { PluginKey, Selection, NodeSelection } from 'prosemirror-state';
import { safeInsert } from 'prosemirror-utils';
import { findTypeAheadQuery, getTypeaheadQueryString } from './helpers/query';
import { SELECT_ITEM } from './action';
import { isChromeWithSelectionBug } from 'bangle-core';

export const typeAheadStatePluginKey = new PluginKey('typeahead-state-plugin');

export const removeTypeAheadMark = () => (editorState, dispatch) => {
  const queryMark = findTypeAheadQuery(editorState);

  if (queryMark === null) {
    return false;
  }

  const { start, end } = queryMark;
  const { schema } = editorState;
  const markType = schema.marks.typeAheadQuery;
  if (start === -1) {
    return false;
  }

  if (dispatch) {
    dispatch(
      editorState.tr
        .removeMark(start, end, markType)
        // stored marks are marks which will be carried forward to whatever
        // the user types next, like if current mark
        // is bold, new input continues being bold
        .removeStoredMark(markType),
    );
  }
  return true;
};

export const dismissCommand = () => (editorState, dispatch) => {
  const queryMark = findTypeAheadQuery(editorState);
  if (queryMark === null) {
    return false;
  }

  const { start, end } = queryMark;
  const { schema } = editorState;
  const markType = schema.marks.typeAheadQuery;
  if (start === -1) {
    return false;
  }

  if (dispatch) {
    dispatch(
      editorState.tr
        .removeMark(start, end, markType)
        .removeStoredMark(markType),
    );
  }
  return true;
};

export const withTypeAheadQueryMarkPosition = (state, cb) => {
  const queryMark = findTypeAheadQuery(state);

  if (!queryMark || queryMark.start === -1) {
    return false;
  }

  return cb(queryMark.start, queryMark.end);
};

export const selectItem = ({ item, trigger }) => (editorState, dispatch) => {
  const queryMark = findTypeAheadQuery(editorState);
  if (!queryMark || queryMark.start === -1) {
    return false;
  }

  const { start, end } = queryMark;

  const insert = (
    maybeNode, // Node | Object | string | Fragment,
    opts = {},
  ) => {
    let tr = editorState.tr
      .setMeta(typeAheadStatePluginKey, { action: SELECT_ITEM })
      .removeStoredMark(editorState.schema.marks.typeAheadQuery)
      .replaceWith(start, end, Fragment.empty);

    if (!maybeNode) {
      return tr;
    }

    const isInputFragment = maybeNode instanceof Fragment;

    let node;
    try {
      node =
        maybeNode instanceof Node || isInputFragment
          ? maybeNode
          : typeof maybeNode === 'string'
          ? editorState.schema.text(maybeNode)
          : Node.fromJSON(editorState.schema, maybeNode);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      return tr;
    }

    if (node.isText) {
      tr = tr.replaceWith(start, start, node);

      /**
       *
       * Replacing a type ahead query mark with a block node.
       *
       */
    } else if (node.isBlock) {
      // throw new Error('nup');
      tr = safeInsert(node)(tr);
      /**
       *
       * Replacing a type ahead query mark with an inline node.
       *
       */
    } else if (node.isInline || isInputFragment) {
      // throw new Error('nup');
      const fragment = isInputFragment
        ? node
        : Fragment.fromArray([node, editorState.schema.text(' ')]);

      tr = tr.replaceWith(start, start, fragment);
      // This problem affects Chrome v58+. See: https://github.com/ProseMirror/prosemirror/issues/710
      if (isChromeWithSelectionBug) {
        const selection = document.getSelection();
        if (selection) {
          selection.empty();
        }
      }

      // TODO-2 do we need this select inline option
      if (opts.selectInlineNode) {
        // Select inserted node
        tr = tr.setSelection(NodeSelection.create(tr.doc, start));
      } else {
        // Placing cursor after node + space.
        tr = tr.setSelection(
          Selection.near(tr.doc.resolve(start + fragment.size)),
        );
      }

      return tr;
    }

    return tr;
  };

  const tr = insert(item.getInsertNode(editorState));

  // TODO this is probably not in use
  if (tr === false) {
    return insertFallbackCommand({ start, end, trigger })(
      editorState,
      dispatch,
    );
  }

  if (dispatch) {
    dispatch(tr);
  }
  return true;
};

function insertFallbackCommand({ start, end, trigger = '' }) {
  return (editorState, dispatch) => {
    const node = editorState.schema.text(
      trigger + getTypeaheadQueryString(editorState),
    );

    if (dispatch) {
      dispatch(editorState.tr.replaceWith(start, end, node));
    }
    return true;
  };
}
