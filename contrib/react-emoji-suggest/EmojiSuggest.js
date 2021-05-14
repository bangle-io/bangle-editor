import reactDOM from 'react-dom';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import {
  getActiveIndex,
  getEmojis,
  getSuggestTooltipKey,
  selectEmoji,
} from './emoji-suggest';

export function EmojiSuggest({ emojiSuggestKey }) {
  const view = useEditorViewContext();
  const { tooltipContentDOM, emojis, maxItems } =
    usePluginState(emojiSuggestKey);
  const { counter, triggerText } = usePluginState(
    getSuggestTooltipKey(emojiSuggestKey),
  );
  const filteredEmojis = useMemo(
    () => getEmojis(emojis, triggerText, maxItems),
    [emojis, triggerText, maxItems],
  );
  const activeIndex = getActiveIndex(counter, filteredEmojis.length);
  const onSelectEmoji = useCallback(
    (emojiKind) => {
      selectEmoji(emojiSuggestKey, emojiKind)(view.state, view.dispatch, view);
    },
    [view, emojiSuggestKey],
  );

  return reactDOM.createPortal(
    <div className="bangle-emoji-suggest">
      {filteredEmojis.map(([emojiKind, emoji], i) => {
        return (
          <Row
            key={emojiKind}
            scrollIntoViewIfNeeded={true}
            isSelected={activeIndex === i}
            emoji={emoji}
            emojiKind={emojiKind}
            onSelectEmoji={onSelectEmoji}
          />
        );
      })}
    </div>,
    tooltipContentDOM,
  );
}

const Row = React.memo(function Row({
  isSelected,
  emoji,
  emojiKind,
  scrollIntoViewIfNeeded = true,
  onSelectEmoji,
}) {
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
    <div
      className={`bangle-row ${isSelected ? 'bangle-is-selected' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        onSelectEmoji(emojiKind);
      }}
      ref={ref}
    >
      <span>{emoji + ' ' + emojiKind}</span>
    </div>
  );
});
