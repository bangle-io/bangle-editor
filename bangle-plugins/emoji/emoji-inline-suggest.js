import React, { useEffect, useRef } from 'react';
import reactDOM from 'react-dom';
import {
  InlineSuggest,
  createTooltipDOM,
  selectItemCommand,
} from '../inline-suggest/index';
import { emojisArray } from './data';

export function EmojiInlineSuggest({ getScrollContainerDOM } = {}) {
  const { tooltipDOM, tooltipContent } = createTooltipDOM();
  let counter = 0;
  const resetCounter = () => {
    counter = 0;
  };

  const onSelection = (emojiKind) => (state, dispatch, view) => {
    const emojiNode = state.schema.nodes.emoji.create({
      'data-emojikind': emojiKind,
    });
    resetCounter();
    return selectItemCommand(emojiNode, inlineSuggest.getMarkName())(
      state,
      dispatch,
      view,
    );
  };
  const getIsTop = () =>
    tooltipDOM.getAttribute('data-popper-placement') === 'top-start';

  const render = (state, dispatch, view) => {
    const emojis = getEmojis(inlineSuggest.getQueryText(state));

    reactDOM.render(
      <Palette
        onClick={(i) => {
          const emojis = getEmojis(inlineSuggest.getQueryText(state));
          if (emojis[i]) {
            const emojiKind = emojis[i][0];
            onSelection(emojiKind)(state, dispatch, view);
          }
        }}
        activeIndex={getActiveIndex(counter, emojis.length)}
        emojis={emojis}
      />,
      tooltipContent,
    );

    return true;
  };

  const inlineSuggest = new InlineSuggest({
    trigger: ':',
    placement: 'bottom-start',
    fallbackPlacements: ['bottom-start', 'top-start'],
    tooltipDOM,
    getScrollContainerDOM,

    onDestroy: () => {
      reactDOM.unmountComponentAtNode(tooltipContent);
      resetCounter();
      return true;
    },

    onUpdate: (state, dispatch, view) => {
      return render(state, dispatch, view);
    },

    onEnter: (state, dispatch, view) => {
      const emojis = getEmojis(inlineSuggest.getQueryText(state));
      const emojiKind = emojis[getActiveIndex(counter, emojis.length)][0];
      return onSelection(emojiKind)(state, dispatch, view);
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
  });

  return inlineSuggest;
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
