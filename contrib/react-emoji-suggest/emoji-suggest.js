import { bangleWarn, rafCommandExec } from '@bangle.dev/core/utils/js-utils';
import { suggestTooltip, createTooltipDOM } from '@bangle.dev/tooltip/index';
import { PluginKey } from '@bangle.dev/core';
import {
  decrementSuggestTooltipCounter,
  incrementSuggestTooltipCounter,
  removeSuggestMark,
  resetSuggestTooltipCounter,
} from '@bangle.dev/tooltip/suggest-tooltip';
import { valuePlugin } from '@bangle.dev/core/utils/pm-utils';
import { pluginKeyStore } from '@bangle.dev/core/utils/plugin-key-store';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  queryTriggerText,
  selectEmoji,
};

const defaultTrigger = ':';
const defaultMaxItems = 2000;
function specFactory({ markName, trigger = defaultTrigger } = {}) {
  const spec = suggestTooltip.spec({ markName, trigger });

  return {
    ...spec,
    options: {
      ...spec.options,
      trigger,
    },
  };
}

const keyStore = pluginKeyStore();

function pluginsFactory({
  key = new PluginKey('emojiSuggestMenu'),
  markName,
  tooltipRenderOpts = {},
  emojis,
  maxItems = defaultMaxItems,
} = {}) {
  return ({ schema, specRegistry }) => {
    const { trigger } = specRegistry.options[markName];

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
        emojis,
        maxItems,
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
          const matchedEmojis = getEmojis(
            emojis,
            queryTriggerText(key)(state),
            maxItems,
          );
          if (matchedEmojis.length === 0) {
            return removeSuggestMark(key)(state, dispatch, view);
          }
          const { counter } = suggestTooltipKey.getState(state);
          const emojiAlias =
            matchedEmojis[getActiveIndex(counter, matchedEmojis.length)][0];
          rafCommandExec(view, resetSuggestTooltipCounter(suggestTooltipKey));
          return selectEmoji(key, emojiAlias)(state, dispatch, view);
        },
        onArrowDown: updateCounter('DOWN'),
        onArrowUp: updateCounter('UP'),
      }),
    ];
  };
}

export function getEmojis(emojis, queryText, maxItems = defaultMaxItems) {
  if (!queryText) {
    return emojis.slice(0, maxItems);
  } else {
    return emojis
      .filter(([item]) => item.includes(queryText))
      .slice(0, maxItems);
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

export function selectEmoji(key, emojiAlias) {
  return (state, dispatch, view) => {
    const emojiNode = state.schema.nodes.emoji.create({
      emojiAlias: emojiAlias,
    });
    return suggestTooltip.replaceSuggestMarkWith(key, emojiNode)(
      state,
      dispatch,
      view,
    );
  };
}
