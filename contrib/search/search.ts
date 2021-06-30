import { PluginKey, Plugin } from '@bangle.dev/core/plugin';
import type { EditorState } from '@bangle.dev/core/prosemirror/state';
import type { Node } from '@bangle.dev/core/prosemirror/model';
import { Decoration, DecorationSet } from '@bangle.dev/core/prosemirror/view';
import { matchAllPlus } from '@bangle.dev/core/utils/js-utils';
import type { Command } from '@bangle.dev/core/prosemirror/commands';

const name = 'search';

export const spec = specFactory;
export const plugins = pluginsFactory;

function specFactory() {
  return {
    name: name,
    type: 'component',
  };
}

function pluginsFactory({
  key = new PluginKey(name),
  query,
}: {
  key: PluginKey;
  query?: string;
}) {
  return () =>
    new Plugin({
      key: key,
      state: {
        init(_, state) {
          return { query, decos: buildDeco(state, query) };
        },
        apply(tr, old, oldState, newState) {
          const meta = tr.getMeta(key);
          if (meta) {
            const newQuery = meta.query;
            return { query: newQuery, decos: buildDeco(newState, newQuery) };
          }
          // For performance only build the
          // decorations if the doc has actually changed
          return tr.docChanged
            ? { query, decos: buildDeco(newState, query) }
            : old;
        },
      },
      props: {
        decorations(state) {
          return this.getState(state).decos;
        },
      },
    });
}

function buildDeco(state: EditorState, query?: string) {
  if (!query) {
    return DecorationSet.empty;
  }
  const regex1 = RegExp(query, 'g');
  const matches = findMatches(state.doc, regex1);
  const decorations = matches.map((match, index) => {
    return Decoration.inline(
      match.baseOffset + match.result[0].start,
      match.baseOffset + match.result[0].end,
      {
        class: `search-match`,
        style: `background-color: yellow;`,
      },
    );
  });

  return DecorationSet.create(state.doc, decorations);
}

function findMatches(doc: Node, regex: RegExp, { caseSensitive = false } = {}) {
  let results: {
    baseOffset: number;
    result: ReturnType<typeof matchAllPlus>;
  }[] = [];
  doc.descendants((node, pos, parent) => {
    if (node.isText) {
      const source = caseSensitive
        ? node.textContent
        : node.textContent.toLocaleLowerCase();

      const matchedResult = matchAllPlus(regex, source); // matchText(query, source, offset, perFileMatchMax);
      if (matchedResult.some((r) => r.match)) {
        results.push({
          baseOffset: pos,
          result: matchedResult.filter((r) => r.match),
        });
      }
    }
  });

  return results;
}

export function updateSearchQuery(key: PluginKey, query?: string): Command {
  return (state, dispatch, _view) => {
    if (dispatch) {
      dispatch(state.tr.setMeta(key, { query }).setMeta('addToHistory', false));
    }
    return true;
  };
}
