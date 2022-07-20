import type { RawPlugins } from '@bangle.dev/core';
import type { Command, EditorProps, Node } from '@bangle.dev/pm';
import {
  Decoration,
  DecorationSet,
  EditorState,
  Plugin,
  PluginKey,
} from '@bangle.dev/pm';
import { matchAllPlus } from '@bangle.dev/utils';

const name = 'search';
export const plugins = pluginsFactory;

function pluginsFactory({
  key = new PluginKey(name),
  query: initialQuery,
  className = 'bangle-search-match',
  maxHighlights = 1500,
}: {
  key: PluginKey<{
    query: string;
    decos: DecorationSet;
  }>;
  query?: RegExp | string;
  className?: string;
  maxHighlights?: number;
}): RawPlugins {
  function buildDeco(state: EditorState, query?: RegExp | string) {
    if (!query) {
      return DecorationSet.empty;
    }
    const matches = findMatches(state.doc, query, maxHighlights);
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
          return key.getState(state)?.decos || null;
        },
      } as EditorProps,
    });
}

function findMatches(doc: Node, regex: RegExp | string, maxHighlights: number) {
  let results: {
    pos: number;
    match: ReturnType<typeof matchAllPlus>[0];
  }[] = [];
  let count = 0;
  let gRegex: RegExp;
  if (regex instanceof RegExp) {
    let flags = 'g';
    if (regex.ignoreCase) {
      flags += 'i';
    }
    if (regex.multiline) {
      flags += 'm';
    }
    gRegex = RegExp(regex.source, flags);
  } else {
    gRegex = RegExp(regex, 'g');
  }

  doc.descendants((node, pos) => {
    if (maxHighlights <= count) {
      return false;
    }
    if (node.isText) {
      const source = node.textContent;

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
    return;
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
