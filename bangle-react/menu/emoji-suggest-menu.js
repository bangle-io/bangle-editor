import { bangleWarn, rafCommandExec } from 'bangle-core/utils/js-utils';
import { suggestTooltip, createTooltipDOM } from 'bangle-plugins/tooltip/index';
import { PluginKey } from 'bangle-core';
import {
  decrementSuggestTooltipCounter,
  incrementSuggestTooltipCounter,
  removeSuggestMark,
  resetSuggestTooltipCounter,
} from 'bangle-plugins/tooltip/suggest-tooltip';
import { valuePlugin } from 'bangle-core/utils/pm-utils';
import { pluginKeyStore } from 'bangle-core/utils/plugin-key-store';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  queryTriggerText,
  selectEmoji,
};

const defaultMarkName = 'emojiSuggest';
const defaultTrigger = ':';

function specFactory({
  markName = defaultMarkName,
  trigger = defaultTrigger,
} = {}) {
  return suggestTooltip.spec({ markName, trigger });
}

const keyStore = pluginKeyStore();

function pluginsFactory({
  key = new PluginKey('emojiSuggestMenu'),
  markName = defaultMarkName,
  trigger = defaultTrigger,
  tooltipRenderOpts,
  emojis,
} = {}) {
  return ({ schema }) => {
    const suggestTooltipKey = keyStore.create(key, 'suggestTooltipKey');

    // We are converting to DOM elements so that their instances
    // can be shared across plugins.
    const tooltipDOMSpec = createTooltipDOM(tooltipRenderOpts.tooltipDOMSpec);

    const getIsTop = () =>
      tooltipDOMSpec.dom.getAttribute('data-popper-placement') === 'top-start';

    if (!schema.marks[markName]) {
      bangleWarn(
        `Couldn't find the markName:${markName}, please make sure you have initialized to use the same markName you initialized the spec with`,
      );
      throw new Error(`markName ${markName} not found`);
    }

    const updateCounter = (key = 'UP') => {
      return (state, dispatch, view) => {
        requestAnimationFrame(() => {
          view.focus();
        });
        if (key === 'UP' ? !getIsTop() : getIsTop()) {
          return decrementSuggestTooltipCounter(suggestTooltipKey)(
            state,
            dispatch,
            view,
          );
        } else {
          return incrementSuggestTooltipCounter(suggestTooltipKey)(
            state,
            dispatch,
            view,
          );
        }
      };
    };
    return [
      valuePlugin(key, {
        tooltipContentDOM: tooltipDOMSpec.contentDOM,
        markName,
      }),
      suggestTooltip.plugins({
        key: suggestTooltipKey,
        markName,
        trigger,
        tooltipRenderOpts: {
          ...tooltipRenderOpts,
          tooltipDOMSpec,
        },
        onEnter: (state, dispatch, view) => {
          const matchedEmojis = getEmojis(emojis, queryTriggerText(key)(state));
          if (matchedEmojis.length === 0) {
            return removeSuggestMark(key)(state, dispatch, view);
          }
          const { counter } = suggestTooltipKey.getState(state);
          const emojiKind =
            matchedEmojis[getActiveIndex(counter, matchedEmojis.length)][0];
          rafCommandExec(view, resetSuggestTooltipCounter(suggestTooltipKey));
          return selectEmoji(key, emojiKind)(state, dispatch, view);
        },
        onArrowDown: updateCounter('DOWN'),
        onArrowUp: updateCounter('UP'),
      }),
    ];
  };
}

export function getEmojis(emojis, queryText) {
  if (!queryText) {
    return emojis.slice(0, 200);
  } else {
    return emojis.filter(([item]) => item.includes(queryText)).slice(0, 20);
  }
}

export function getActiveIndex(counter, size) {
  const r = counter % size;

  return r < 0 ? r + size : r;
}

export function getSuggestTooltipKey(key) {
  return keyStore.get(key, 'suggestTooltipKey');
}

/** Commands */
export function queryTriggerText(key) {
  return suggestTooltip.queryTriggerText(getSuggestTooltipKey(key));
}

export function selectEmoji(key, emojiKind) {
  return (state, dispatch, view) => {
    const emojiNode = state.schema.nodes.emoji.create({
      emojiKind: emojiKind,
    });
    return suggestTooltip.replaceSuggestMarkWith(key, emojiNode)(
      state,
      dispatch,
      view,
    );
  };
}
