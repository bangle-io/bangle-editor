import reactDOM from 'react-dom';
import { EditorViewContext } from '@banglejs/react';
import { usePluginState } from '@banglejs/react/hooks';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
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
  const filteredEmojis = useMemo(() => getEmojis(emojis, triggerText), [
    emojis,
    triggerText,
  ]);
  const activeIndex = getActiveIndex(counter, filteredEmojis.length);
  const onSelectEmoji = useCallback(
    (emojiKind) => {
      selectEmoji(emojiSuggestKey, emojiKind)(view.state, view.dispatch, view);
    },
    [view, emojiSuggestKey],
  );

  return reactDOM.createPortal(
    <div className="bangle-emoji-suggest-menu">
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
    emojiPluginState.tooltipContentDOM,
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
