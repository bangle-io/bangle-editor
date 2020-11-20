import { EditorViewContext } from 'bangle-react/react-editor';
import reactDOM from 'react-dom';
import { usePluginState } from 'bangle-react/use-plugin-state';
import React, { useContext, useEffect, useRef } from 'react';
import {
  getActiveIndex,
  getEmojis,
  getSuggestTooltipKey,
  selectEmoji,
} from './emoji-suggest-menu';

export function EmojiSuggestMenu({ emojiSuggestKey, emojis }) {
  const view = useContext(EditorViewContext);
  const emojiPluginState = usePluginState(emojiSuggestKey);
  const { counter, triggerText } = usePluginState(
    getSuggestTooltipKey(emojiSuggestKey),
  );
  const filteredEmojis = getEmojis(emojis, triggerText);
  const activeIndex = getActiveIndex(counter, filteredEmojis.length);
  return reactDOM.createPortal(
    <Palette
      activeIndex={activeIndex}
      filteredEmojis={filteredEmojis}
      onSelectEmoji={(emojiKind) => {
        selectEmoji(emojiSuggestKey, emojiKind)(
          view.state,
          view.dispatch,
          view,
        );
      }}
    />,
    emojiPluginState.tooltipContentDOM,
  );
}

function Palette({ activeIndex, filteredEmojis, onSelectEmoji }) {
  return (
    <div className="bangle-inline-suggest-emoji">
      {filteredEmojis.map(([key, emoji], i) => (
        <Row
          key={key}
          scrollIntoViewIfNeeded={true}
          isSelected={activeIndex === i}
          title={emoji + ' ' + key}
          onClick={(e) => {
            e.preventDefault();
            if (filteredEmojis[i]) {
              const emojiKind = filteredEmojis[i][0];
              onSelectEmoji(emojiKind);
            }
          }}
        />
      ))}
    </div>
  );
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
