import { findFirstMarkPosition, filter } from 'bangle-core/utils/pm-utils';
import { keymap } from 'prosemirror-keymap';
import {
  triggerInputRule,
  tooltipController,
  removeTypeAheadMarkCmd,
  helpers,
} from 'bangle-plugins/inline-suggest/index';
import { Plugin, PluginKey } from 'bangle-core';
import { pluginKeyStore } from 'bangle-plugins/helpers/utils';
import { createTooltipDOM } from './create-tooltip-dom';
import { tooltipPlacement } from './index';

const LOG = true;
let log = LOG ? console.log.bind(console, 'plugins/inline-suggest') : () => {};

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  getQueryText,
  isTooltipActive,
};

const keyStore = pluginKeyStore();

const TOOLTIP_KEY = 'inlineSuggest__tooltip';

export const getTooltipKey = (parentKey) => {
  return keyStore.get(parentKey, TOOLTIP_KEY);
};
const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

export function specFactory({ markName, trigger }) {
  return {
    name: markName,
    type: 'mark',
    schema: {
      inclusive: true,
      group: 'triggerMarks',
      parseDOM: [{ tag: `span[data-${markName}]` }],
      toDOM: (node) => {
        return [
          'span',
          {
            [`data-${markName}`]: 'true',
            'data-trigger': node.attrs.trigger,
            'style': `color: #0052CC`,
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

export function pluginsFactory({
  key = new PluginKey('inline_suggest_key'),
  markName,
  trigger,
  tooltipDOM,
  tooltipContent: tooltipContentDOM,
  placement = 'bottom-start',
  enterKeyName = 'Enter',
  arrowUpKeyName = 'ArrowUp',
  arrowDownKeyName = 'ArrowDown',
  escapeKeyName = 'Escape',
  fallbackPlacements,
  // Use another key to mimic enter behaviour for example, Tab for entering
  alternateEnterKeyName,

  getScrollContainerDOM = (view) => {
    return view.dom.parentElement;
  },
  tooltipOffset = () => {
    return [0, 0.4 * rem];
  },
  onUpdateTooltip = (state, dispatch, view) => {},
  // No need to call removeTypeAheadMarkCmd on onHideTooltip
  onHideTooltip = (state, dispatch, view) => {},
  onEnter = (state, dispatch, view) => {
    return removeTypeAheadMarkCmd(state.schema.marks[markName])(
      state,
      dispatch,
      view,
    );
  },
  onArrowDown = (state, dispatch, view) => {
    return true;
  },
  onArrowUp = (state, dispatch, view) => {
    return true;
  },
  onEscape = (state, dispatch, view) => {
    return removeTypeAheadMarkCmd(state.schema.marks[markName])(
      state,
      dispatch,
      view,
    );
  },
} = {}) {
  const isActiveCheck = isTooltipActive(key);

  if (!tooltipDOM) {
    ({ tooltipContentDOM, tooltipDOM } = createTooltipDOM());
    tooltipContentDOM.textContent = 'hello world';
  }

  const keybindings = {
    [enterKeyName]: filter(isActiveCheck, onEnter),
    [arrowUpKeyName]: filter(isActiveCheck, onArrowUp),
    [arrowDownKeyName]: filter(isActiveCheck, onArrowDown),
    [escapeKeyName]: filter(isActiveCheck, onEscape),
  };
  if (alternateEnterKeyName) {
    keybindings[alternateEnterKeyName] = keybindings[enterKeyName];
  }

  return ({ schema }) => {
    const plugin = tooltipPlacement.plugins({
      pluginName: 'inlineSuggest' + trigger + '__tooltipPlacementKey',
      tooltipStateKey: key,
      placement,
      fallbackPlacements,
      tooltipOffset,
      tooltipDOM,
      getScrollContainerDOM,
      getReferenceElement: referenceElement((state) => {
        const markType = schema.marks[markName];
        const { selection } = state;
        return findFirstMarkPosition(
          markType,
          state.doc,
          selection.from - 1,
          selection.to,
        );
      }),
      onUpdateTooltip: onUpdateTooltip,
      onHideTooltip: onHideTooltip,
    });
    return [
      new Plugin({
        key,
        state: {
          init(_, state) {
            return { trigger, markName, show: false };
          },
          apply(tr, pluginState) {
            const meta = tr.getMeta(key);
            if (meta === undefined) {
              return pluginState;
            }

            // Do not change object reference if show was and is false
            if (meta.show === false && pluginState.show === false) {
              return pluginState;
            }

            return { ...pluginState, show: meta.show };
          },
        },
      }),
      plugin,
      keymap(keybindings),
      triggerInputRule(schema, markName, trigger),
      tooltipController({
        trigger,
        markName,
        showTooltip: showSuggestionsTooltip(key),
        hideTooltip: hideSuggestionsTooltip(key),
      }),
    ];
  };
}

// export function createTooltipDOM(className = 'bangle-tooltip') {
//   const tooltipDOM = document.createElement('div');
//   tooltipDOM.className = className;
//   tooltipDOM.setAttribute('role', 'tooltip');
//   const tooltipContent = document.createElement('div');
//   tooltipContent.className = className + '-content';
//   tooltipDOM.appendChild(tooltipContent);
//   return { tooltipDOM, tooltipContent };
// }

function referenceElement(getActiveMarkPos) {
  return (view, tooltipDOM, scrollContainerDOM) => {
    return {
      getBoundingClientRect: () => {
        let state = view.state;
        const markPos = getActiveMarkPos(state);
        // add by + so that we get the position right after trigger
        const startPos = markPos.start > -1 ? markPos.start + 1 : 0;
        const start = view.coordsAtPos(startPos);

        // if the query spanned two lines, we want to show the tooltip based on the end pos
        // so that it doesn't hide the query
        const end = view.coordsAtPos(markPos.end > -1 ? markPos.end : startPos);

        let { left, right } = start;
        let { top, bottom } = end;

        let z = {
          width: right - left,
          height: bottom - top,
          top: top,
          right: left,
          bottom: bottom,
          left: left,
        };

        return z;
      },
    };
  };
}

/** COMMANDS */
export function getQueryText(key) {
  return (state) => {
    const { trigger, markName } = key.getState(state);
    const markType = state.schema.marks[markName];
    return helpers.getQueryText(state, markType, trigger);
  };
}

export function isTooltipActive(key) {
  return (state) => {
    return key.getState(state)?.show;
  };
}

export function showSuggestionsTooltip(key) {
  return (state, dispatch, view) => {
    if (dispatch) {
      dispatch(
        state.tr.setMeta(key, { show: true }).setMeta('addToHistory', false),
      );
    }
    return true;
  };
}

export function hideSuggestionsTooltip(key) {
  return (state, dispatch, view) => {
    if (dispatch) {
      dispatch(
        state.tr.setMeta(key, { show: false }).setMeta('addToHistory', false),
      );
    }
    return true;
  };
}
