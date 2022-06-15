import type { BaseRawMarkSpec, RawPlugins } from '@bangle.dev/core';
import {
  Command,
  EditorState,
  Fragment,
  keymap,
  MarkType,
  Node,
  Plugin,
  PluginKey,
  Schema,
  Selection,
} from '@bangle.dev/pm';
import {
  assertNotUndefined,
  createObject,
  filter,
  findFirstMarkPosition,
  isChromeWithSelectionBug,
  safeInsert,
} from '@bangle.dev/utils';

import type {
  GetReferenceElementFunction,
  TooltipRenderOpts,
} from './tooltip-placement';
import * as tooltipPlacement from './tooltip-placement';
import { triggerInputRule } from './trigger-input-rule';

const LOG = false;
let log = LOG ? console.log.bind(console, 'plugins/suggest-tooltip') : () => {};

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  queryTriggerText,
  queryIsSuggestTooltipActive,
  replaceSuggestMarkWith,
  incrementSuggestTooltipCounter,
  decrementSuggestTooltipCounter,
  resetSuggestTooltipCounter,
};

export const defaultKeys = {
  select: 'Enter',
  up: 'ArrowUp',
  down: 'ArrowDown',
  hide: 'Escape',
  right: undefined,
  left: undefined,
};

function specFactory({
  markName,
  trigger,
  markColor = '#005893',
}: {
  markName: string;
  trigger: string;
  markColor?: string;
}): BaseRawMarkSpec {
  return {
    name: markName,
    type: 'mark',
    schema: {
      inclusive: true,
      excludes: '_',
      group: 'suggestTriggerMarks',
      parseDOM: [{ tag: `span[data-${markName}]` }],
      toDOM: (mark) => {
        return [
          'span',
          {
            'data-bangle-name': markName,
            'data-suggest-trigger': mark.attrs['trigger'],
            'style': `color: ${markColor}`,
          },
        ];
      },
      attrs: {
        trigger: { default: trigger },
      },
    },
    markdown: {
      toMarkdown: {
        open: '',
        close: '',
        mixable: true,
      },
    },
  };
}

export type SuggestTooltipRenderOpts = Omit<
  TooltipRenderOpts,
  'getReferenceElement'
>;

interface PluginsOptions {
  key?: PluginKey;
  markName: string;
  trigger: string;
  tooltipRenderOpts: SuggestTooltipRenderOpts;
  keybindings?: any;
  onEnter?: Command;
  onArrowDown?: Command;
  onArrowUp?: Command;
  onEscape?: Command;
  onArrowLeft?: Command;
  onArrowRight?: Command;
}
interface PluginState {
  triggerText: string;
  show: boolean;
  counter: number;
  trigger: string;
  markName: string;
}

function pluginsFactory({
  key = new PluginKey('suggest_tooltip'),
  markName,
  trigger,
  tooltipRenderOpts,
  keybindings = defaultKeys,
  onEnter = (state, dispatch, view) => {
    return removeSuggestMark(key)(state, dispatch, view);
  },
  onArrowDown = incrementSuggestTooltipCounter(key),
  onArrowUp = decrementSuggestTooltipCounter(key),
  onEscape = (state, dispatch, view) => {
    return removeSuggestMark(key)(state, dispatch, view);
  },
  onArrowLeft,
  onArrowRight,
}: PluginsOptions) {
  return ({ schema }: { schema: Schema }) => {
    const isActiveCheck = queryIsSuggestTooltipActive(key);
    return [
      new Plugin<PluginState>({
        key,
        state: {
          init(_, _state) {
            return {
              trigger,
              markName,
              triggerText: '',
              show: false,
              counter: 0,
            };
          },
          apply(tr, pluginState, _oldState, newState) {
            const meta = tr.getMeta(key);
            if (meta === undefined) {
              return pluginState;
            }
            if (meta.type === 'RENDER_TOOLTIP') {
              return {
                ...pluginState,
                // Cannot use queryTriggerText because it relies on
                // reading the pluginState which will not be there in newState.
                triggerText: getTriggerText(newState, markName, trigger),
                show: true,
              };
            }
            if (meta.type === 'HIDE_TOOLTIP') {
              // Do not change object reference if show was and is false
              if (pluginState.show === false) {
                return pluginState;
              }
              return {
                ...pluginState,
                triggerText: '',
                show: false,
                counter: 0,
              };
            }
            if (meta.type === 'INCREMENT_COUNTER') {
              return { ...pluginState, counter: pluginState.counter + 1 };
            }
            if (meta.type === 'RESET_COUNTER') {
              return { ...pluginState, counter: 0 };
            }
            if (meta.type === 'UPDATE_COUNTER') {
              return { ...pluginState, counter: meta.value };
            }
            if (meta.type === 'DECREMENT_COUNTER') {
              return { ...pluginState, counter: pluginState.counter - 1 };
            }
            throw new Error('Unknown type');
          },
        },
      }),
      tooltipPlacement.plugins({
        stateKey: key,
        renderOpts: {
          ...tooltipRenderOpts,
          getReferenceElement: referenceElement((state: EditorState) => {
            const markType = schema.marks[markName];
            assertNotUndefined(markType, `markType ${markName} not found`);

            const { selection } = state;
            return findFirstMarkPosition(
              markType,
              state.doc,
              selection.from - 1,
              selection.to,
            );
          }),
        },
      }),
      triggerInputRule(schema, markName, trigger),
      tooltipController({
        trigger,
        markName,
        key,
      }),
      keybindings &&
        keymap(
          createObject([
            [keybindings.select, filter(isActiveCheck, onEnter)],
            [keybindings.up, filter(isActiveCheck, onArrowUp)],
            [keybindings.down, filter(isActiveCheck, onArrowDown)],
            [keybindings.left, filter(isActiveCheck, onArrowLeft)],
            [keybindings.right, filter(isActiveCheck, onArrowRight)],
            [keybindings.hide, filter(isActiveCheck, onEscape)],
          ]),
        ),
    ];
  };
}

function referenceElement(
  getActiveMarkPos: (state: EditorState) => { start: number; end: number },
): GetReferenceElementFunction {
  return (view, _tooltipDOM, _scrollContainerDOM) => {
    return {
      getBoundingClientRect: () => {
        let state = view.state;
        const markPos = getActiveMarkPos(state);
        // add by + so that we get the position right after trigger
        const startPos = markPos.start > -1 ? markPos.start + 1 : 0;
        const start = view.coordsAtPos(startPos);
        // if the suggestMark text spanned two lines, we want to show the tooltip based on the end pos
        // so that it doesn't hide the text
        const end = view.coordsAtPos(markPos.end > -1 ? markPos.end : startPos);

        let { left, right } = start;
        let { top, bottom } = end;
        const x = left;
        const y = top;
        const width = right - left;
        const height = bottom - top;
        return new DOMRect(x, y, width, height);
      },
    };
  };
}

function tooltipController({
  key,
  trigger,
  markName,
}: {
  key: PluginKey;
  trigger: string;
  markName: string;
}) {
  return new Plugin({
    view() {
      return {
        update: (view, lastState) => {
          const { state } = view;
          if (lastState === state || !state.selection.empty) {
            return;
          }
          const markType = state.schema.marks[markName];
          assertNotUndefined(markType, `markType ${markName} not found`);

          if (
            lastState.doc.eq(state.doc) &&
            state.selection.eq(lastState && lastState.selection) &&
            // This is a shorthand for checking if the stored mark  of `markType`
            // has changed within the last step. If it has we need to update the state
            isStoredMark(state, markType) === isStoredMark(lastState, markType)
          ) {
            return;
          }

          const isMarkActive = isSuggestMarkActive(markName)(state);

          // clear the mark if the user delete the trigger but remaining mark text
          // stayed.
          // Example `<mark>/hello</mark>` --(user deletes the /)-> `<mark>hello</mark>`
          // -> (clear) ->  hello
          if (isMarkActive && !doesQueryHaveTrigger(state, markType, trigger)) {
            removeSuggestMark(key)(state, view.dispatch, view);
            return;
          }

          if (!isMarkActive) {
            // performance optimization to prevent unnecessary dispatches
            if (key.getState(state).show === true) {
              hideSuggestionsTooltip(key)(view.state, view.dispatch, view);
            }
            return;
          }

          renderSuggestionsTooltip(key)(view.state, view.dispatch, view);
          return;
        },
      };
    },
  });
}

function isStoredMark(state: EditorState, markType: MarkType) {
  return state && state.storedMarks && markType.isInSet(state.storedMarks);
}

function isSuggestMarkActive(markName: string) {
  return (state: EditorState) => {
    const { from, to } = state.selection;

    const markType = state.schema.marks[markName];
    assertNotUndefined(markType, `markType ${markName} not found`);

    return state.doc.rangeHasMark(from - 1, to, markType);
  };
}

function doesQueryHaveTrigger(
  state: EditorState,
  markType: MarkType,
  trigger: string,
) {
  const { nodeBefore } = state.selection.$from;

  // nodeBefore in a new line (a new paragraph) is null
  if (!nodeBefore) {
    return false;
  }

  const suggestMark = markType.isInSet(nodeBefore.marks || []);

  // suggestMark is undefined if you delete the trigger while keeping rest of the query alive
  if (!suggestMark) {
    return false;
  }

  const textContent = nodeBefore.textContent || '';

  return textContent.includes(trigger);
}

function renderSuggestionsTooltip(key: PluginKey): Command {
  return (state, dispatch, _view) => {
    if (dispatch) {
      dispatch(
        state.tr
          .setMeta(key, { type: 'RENDER_TOOLTIP' })
          .setMeta('addToHistory', false),
      );
    }
    return true;
  };
}

function hideSuggestionsTooltip(key: PluginKey): Command {
  return (state, dispatch, _view) => {
    if (dispatch) {
      dispatch(
        state.tr
          .setMeta(key, { type: 'HIDE_TOOLTIP' })
          .setMeta('addToHistory', false),
      );
    }
    return true;
  };
}

function getTriggerText(state: EditorState, markName: string, trigger: string) {
  const markType = state.schema.marks[markName];
  assertNotUndefined(markType, `markType ${markName} not found`);

  const { nodeBefore } = state.selection.$from;

  // nodeBefore in a new line (a new paragraph) is null
  if (!nodeBefore) {
    return '';
  }

  const suggestMark = markType.isInSet(nodeBefore.marks || []);

  // suggestMark is undefined if you delete the trigger while keeping rest of the query alive
  if (!suggestMark) {
    return '';
  }

  const textContent = nodeBefore.textContent || '';
  return (
    textContent
      // eslint-disable-next-line no-control-regex
      .replace(/^([^\x00-\xFF]|[\s\n])+/g, '')
      .replace(trigger, '')
  );
}

/** Commands */

export function queryTriggerText(key: PluginKey) {
  return (state: EditorState) => {
    const { trigger, markName } = key.getState(state);
    return getTriggerText(state, markName, trigger);
  };
}

export function queryIsSuggestTooltipActive(key: PluginKey) {
  return (state: EditorState) => {
    return key.getState(state) && key.getState(state).show;
  };
}

export function replaceSuggestMarkWith(
  key: PluginKey,
  maybeNode?: string | Node | Fragment,
): Command {
  return (state, dispatch, view) => {
    const { markName } = key.getState(state);
    const { schema } = state;
    const markType = schema.marks[markName];
    assertNotUndefined(markType, `markType ${markName} not found`);

    const { selection } = state;
    const queryMark = findFirstMarkPosition(
      markType,
      state.doc,
      selection.from - 1,
      selection.to,
    );

    if (!queryMark || queryMark.start === -1) {
      return false;
    }

    const getTr = () => {
      const { start, end } = queryMark;
      let tr = state.tr
        .removeStoredMark(markType)
        .replaceWith(start, end, Fragment.empty);

      if (!maybeNode) {
        return tr;
      }

      const isInputFragment = maybeNode instanceof Fragment;

      let node: any;
      try {
        node =
          maybeNode instanceof Node || isInputFragment
            ? maybeNode
            : typeof maybeNode === 'string'
            ? state.schema.text(maybeNode)
            : Node.fromJSON(state.schema, maybeNode);
      } catch (e) {
        console.error(e);
        return tr;
      }

      if (node.isText) {
        tr = tr.replaceWith(start, start, node);
      } else if (node.isBlock) {
        tr = safeInsert(node)(tr);
      } else if (node.isInline || isInputFragment) {
        const fragment = isInputFragment
          ? node
          : Fragment.fromArray([node, state.schema.text(' ')]);

        tr = tr.replaceWith(start, start, fragment);
        // This problem affects Chrome v58+. See: https://github.com/ProseMirror/prosemirror/issues/710
        if (isChromeWithSelectionBug) {
          const selection = document.getSelection();
          if (selection) {
            selection.empty();
          }
        }

        // Placing cursor after node + space.
        tr = tr.setSelection(
          Selection.near(tr.doc.resolve(start + fragment.size)),
        );

        return tr;
      }

      return tr;
    };

    const tr = getTr();

    if (dispatch) {
      view?.focus();
      dispatch(tr);
    }

    return true;
  };
}

export function removeSuggestMark(key: PluginKey): Command {
  return (state, dispatch, _view) => {
    const { markName } = key.getState(state);
    const { schema, selection } = state;
    const markType = schema.marks[markName];
    assertNotUndefined(markType, `markType ${markName} not found`);

    const queryMark = findFirstMarkPosition(
      markType,
      state.doc,
      selection.from - 1,
      selection.to,
    );

    const { start, end } = queryMark;
    if (
      start === -1 &&
      state.storedMarks &&
      markType.isInSet(state.storedMarks)
    ) {
      if (dispatch) {
        dispatch(state.tr.removeStoredMark(markType));
      }

      return true;
    }

    if (start === -1) {
      return false;
    }

    if (dispatch) {
      dispatch(
        state.tr
          .removeMark(start, end, markType)
          // stored marks are marks which will be carried forward to whatever
          // the user types next, like if current mark
          // is bold, new input continues being bold
          .removeStoredMark(markType)
          // This helps us avoid the case:
          // when a user deleted the trigger/ in '<suggest_mark>/something</suggest_mark>'
          // and then performs undo.
          // If we do not hide this from history, command z will bring
          // us in the state of `<suggest_mark>something<suggest_mark>` without the trigger `/`
          // and seeing this state `tooltipActivatePlugin` plugin will dispatch a new command removing
          // the mark, hence never allowing the user to command z.
          .setMeta('addToHistory', false),
      );
    }
    return true;
  };
}

export function incrementSuggestTooltipCounter(key: PluginKey): Command {
  return (state, dispatch, _view) => {
    if (dispatch) {
      dispatch(
        state.tr
          .setMeta(key, { type: 'INCREMENT_COUNTER' })
          .setMeta('addToHistory', false),
      );
    }
    return true;
  };
}

export function decrementSuggestTooltipCounter(key: PluginKey): Command {
  return (state, dispatch, _view) => {
    if (dispatch) {
      dispatch(
        state.tr
          .setMeta(key, { type: 'DECREMENT_COUNTER' })
          .setMeta('addToHistory', false),
      );
    }
    return true;
  };
}

export function resetSuggestTooltipCounter(key: PluginKey): Command {
  return (state, dispatch, _view) => {
    if (dispatch) {
      dispatch(
        state.tr
          .setMeta(key, { type: 'RESET_COUNTER' })
          .setMeta('addToHistory', false),
      );
    }
    return true;
  };
}

export function updateSuggestTooltipCounter(
  key: PluginKey,
  counter: number,
): Command {
  return (state, dispatch, _view) => {
    if (dispatch) {
      dispatch(
        state.tr
          .setMeta(key, { type: 'UPDATE_COUNTER', value: counter })
          .setMeta('addToHistory', false),
      );
    }
    return true;
  };
}
