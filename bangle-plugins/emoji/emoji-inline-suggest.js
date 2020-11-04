import { bangleWarn } from 'bangle-core/utils/js-utils';
import { valuePlugin } from 'bangle-core/utils/pm-utils';
import { pluginKeyStore } from 'bangle-plugins/helpers/utils';
import { PluginKey } from 'prosemirror-state';
import React, { useEffect, useRef } from 'react';
import reactDOM from 'react-dom';
import { inlineSuggest, selectItemCommand } from '../inline-suggest/index';
import { emojisArray } from './data';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  getQueryText,
  selectEmoji,
};

const defaultMarkName = 'emoji-inline-suggest';
const defaultTrigger = ':';
const keyStore = pluginKeyStore();
const INLINE_SUGGEST_KEY = 'emojiInlineSuggest__inlineSuggest';

const getInlineSuggestKey = (parentKey) => {
  return keyStore.get(parentKey, INLINE_SUGGEST_KEY);
};

function specFactory({
  markName = defaultMarkName,
  trigger = defaultTrigger,
} = {}) {
  return inlineSuggest.spec({ markName, trigger });
}

function pluginsFactory({
  key = new PluginKey('emoji-inline-suggest'),
  markName = defaultMarkName,
  trigger = defaultTrigger,
  getScrollContainerDOM,
} = {}) {
  const inlineSuggestKey = keyStore.create(key, INLINE_SUGGEST_KEY);

  const { tooltipDOM, tooltipContent } = inlineSuggest.createTooltipDOM();
  let counter = 0;
  const resetCounter = () => {
    counter = 0;
  };

  const getIsTop = () =>
    tooltipDOM.getAttribute('data-popper-placement') === 'top-start';

  const render = (state, dispatch, view) => {
    const emojis = getEmojis(getQueryText(key)(state));

    reactDOM.render(
      <Palette
        onClick={(i) => {
          const emojis = getEmojis(getQueryText(key)(state));
          if (emojis[i]) {
            const emojiKind = emojis[i][0];

            selectEmoji(key, emojiKind)(state, dispatch, view);
          }
        }}
        activeIndex={getActiveIndex(counter, emojis.length)}
        emojis={emojis}
      />,
      tooltipContent,
    );

    return true;
  };

  return ({ schema }) => {
    if (!schema.marks[markName]) {
      bangleWarn(
        `Couldn't find the markName:${markName}, please make sure you have initialized to use the same markName you initialized the spec with`,
      );
      throw new Error(`markName ${markName} not found`);
    }

    return [
      valuePlugin(key, { markName }),
      inlineSuggest.plugins({
        key: inlineSuggestKey,
        markName,
        trigger,
        placement: 'bottom-start',
        fallbackPlacements: ['bottom-start', 'top-start'],
        tooltipDOM,
        getScrollContainerDOM,

        onHideTooltip: () => {
          reactDOM.unmountComponentAtNode(tooltipContent);
          resetCounter();
          return true;
        },

        onUpdateTooltip: (state, dispatch, view) => {
          return render(state, dispatch, view);
        },

        onEnter: (state, dispatch, view) => {
          const emojis = getEmojis(getQueryText(key)(state));
          if (emojis.length === 0) {
            return false;
          }
          const emojiKind = emojis[getActiveIndex(counter, emojis.length)][0];
          resetCounter();
          return selectEmoji(key, emojiKind)(state, dispatch, view);
        },

        onArrowDown: (state, dispatch, view) => {
          // reverse the direction if the tooltip has a top position
          if (getIsTop()) {
            counter--;
          } else {
            counter++;
          }
          view.focus();
          return render(state, dispatch, view);
        },

        onArrowUp: (state, dispatch, view) => {
          if (getIsTop()) {
            counter++;
          } else {
            counter--;
          }
          view.focus();
          return render(state, dispatch, view);
        },
      }),
    ];
  };
}

function Palette({ emojis, activeIndex, onClick }) {
  return (
    <div className="bangle-inline-suggest-emoji">
      {emojis.map(([key, emoji], i, array) => (
        <Row
          key={key}
          scrollIntoViewIfNeeded={true}
          isSelected={activeIndex === i}
          title={emoji + ' ' + key}
          onClick={(e) => {
            e.preventDefault();
            onClick(i);
          }}
        />
      ))}
    </div>
  );
}

function getActiveIndex(counter, size) {
  const r = counter % size;

  return r < 0 ? r + size : r;
}

function getEmojis(queryText) {
  if (!queryText) {
    return emojisArray.slice(0, 200);
  } else {
    return emojisArray
      .filter(([item]) => item.includes(queryText))
      .slice(0, 20);
  }
}

function Row({ title, isSelected, onClick, scrollIntoViewIfNeeded = true }) {
  const ref = useRef(null);

  useEffect(() => {
    if (scrollIntoViewIfNeeded && isSelected) {
      if ('scrollIntoViewIfNeeded' in document.body) {
        ref.current.scrollIntoViewIfNeeded(false);
      } else {
        ref.current.scrollIntoView(false);
      }
    }
  }, [scrollIntoViewIfNeeded, isSelected]);

  return (
    <div onClick={onClick} ref={ref} data-is-selected={isSelected}>
      <span>{title}</span>
    </div>
  );
}

export function getQueryText(key) {
  return inlineSuggest.getQueryText(getInlineSuggestKey(key));
}

export function selectEmoji(key, emojiKind) {
  return (state, dispatch, view) => {
    const { markName } = key.getState(state);
    const emojiNode = state.schema.nodes.emoji.create({
      'data-emojikind': emojiKind,
    });
    return selectItemCommand(emojiNode, markName)(state, dispatch, view);
  };
}
