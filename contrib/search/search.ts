import { matchAllPlus } from '@bangle.dev/js-utils';
import type { Command } from 'prosemirror-commands';
import type { Node } from 'prosemirror-model';
import { EditorState, Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

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
  caseSensitive = false,
}: {
  key: PluginKey;
  query?: RegExp | string;
  className?: string;
  maxHighlights?: number;
  caseSensitive?: boolean;
}) {
  function buildDeco(state: EditorState, query?: RegExp | string) {
    if (!query) {
      return DecorationSet.empty;
    }
    const matches = findMatches(state.doc, query, maxHighlights, caseSensitive);
    const decorations = matches.map((match) => {
      // TODO we should improve the performance
      // by only creating decos which need an update
      // see https://discuss.prosemirror.net/t/how-to-update-multiple-inline-decorations-on-node-change/1493
      return Decoration.inline(
        match.pos + match.match.start,
        match.pos + match.match.end,
        {
          class: className,
        },
      );
    });

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
  maxHighlights: number,
  caseSensitive: boolean,
) {
  let results: {
    pos: number;
    match: ReturnType<typeof matchAllPlus>[0];
  }[] = [];
  let count = 0;
  const gRegex = RegExp(regex, 'g');
  doc.descendants((node, pos) => {
    if (maxHighlights <= count) {
      return false;
    }
    if (node.isText) {
      const source = caseSensitive
        ? node.textContent
        : node.textContent.toLocaleLowerCase();

      const matchedResult = matchAllPlus(gRegex, source);
      for (const match of matchedResult) {
        if (!match.match) {
          continue;
        }
        if (maxHighlights <= count++) {
          break;
        }
        results.push({
          pos,
          match,
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
