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
  query: initialQuery,
  className = 'bangle-search-match',
  maxHighlights = 1500,
}: {
  key: PluginKey;
  query?: RegExp | string;
  className?: string;
  maxHighlights?: number;
}) {
  function buildDeco(state: EditorState, query?: RegExp | string) {
    if (!query) {
      return DecorationSet.empty;
    }
    const regex1 = query;
    const matches = findMatches(state.doc, regex1);
    const decorations = matches
      .flatMap((match, index) => {
        return match.result.map((result) => {
          return Decoration.inline(
            match.baseOffset + result.start,
            match.baseOffset + result.end,
            {
              class: className,
            },
          );
        });
      })
      .slice(0, maxHighlights);

    return DecorationSet.create(state.doc, decorations);
  }
  return () =>
    new Plugin({
      key: key,
      state: {
        init(_, state) {
          return {
            query: initialQuery,
            decos: buildDeco(state, initialQuery),
          };
        },
        apply(tr, old, oldState, newState) {
          const meta = tr.getMeta(key);
          if (meta) {
            const newQuery = meta.query;
            return {
              query: newQuery,
              decos: buildDeco(newState, newQuery),
            };
          }
          return tr.docChanged
            ? {
                query: old.query,
                decos: buildDeco(newState, old.query),
              }
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

function findMatches(
  doc: Node,
  regex: RegExp | string,
  { caseSensitive = false } = {},
) {
  let results: {
    baseOffset: number;
    result: ReturnType<typeof matchAllPlus>;
  }[] = [];

  const gRegex = RegExp(regex, 'g');
  doc.descendants((node, pos) => {
    if (node.isText) {
      const source = caseSensitive
        ? node.textContent
        : node.textContent.toLocaleLowerCase();

      const matchedResult = matchAllPlus(gRegex, source);

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

export function updateSearchQuery(
  key: PluginKey,
  query?: RegExp | string,
): Command {
  return (state, dispatch, _view) => {
    if (dispatch) {
      dispatch(state.tr.setMeta(key, { query }).setMeta('addToHistory', false));
    }
    return true;
  };
}
