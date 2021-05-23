import reactDOM from 'react-dom';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import {
  getActiveIndex,
  getSuggestTooltipKey,
  selectEmoji,
} from './emoji-suggest';

export function EmojiSuggest({
  emojiSuggestKey,
  squareSide = 32,
  squareMargin = 2,
  rowWidth = 406,
  palettePadding = 4,
}) {
  const {
    counter,
    triggerText,
    show: isVisible,
  } = usePluginState(getSuggestTooltipKey(emojiSuggestKey));
  const view = useEditorViewContext();

  const { tooltipContentDOM, getEmojis, maxItems } =
    usePluginState(emojiSuggestKey);

  return reactDOM.createPortal(
    <div className="bangle-emoji-suggest" style={{ padding: palettePadding }}>
      <div
        style={{
          width: rowWidth,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {isVisible && (
          <EmojiSuggestContainer
            view={view}
            rowWidth={rowWidth}
            squareMargin={squareMargin}
            squareSide={squareSide}
            emojiSuggestKey={emojiSuggestKey}
            getEmojis={getEmojis}
            maxItems={maxItems}
            triggerText={triggerText}
            counter={counter}
          />
        )}
      </div>
    </div>,
    tooltipContentDOM,
  );
}

export function EmojiSuggestContainer({
  view,
  rowWidth,
  squareMargin,
  squareSide,
  emojiSuggestKey,
  getEmojis,
  triggerText,
  counter,
}) {
  const squareFullWidth = squareSide + 2 * squareMargin;
  // -2 to account for borders and safety
  const rowCount = Math.floor((rowWidth - 2) / squareFullWidth);
  const containerWidth = rowCount * squareFullWidth;

  const filteredEmojis = useMemo(
    () => getEmojis(triggerText),
    [getEmojis, triggerText],
  );

  const activeIndex = getActiveIndex(counter, filteredEmojis.length);
  const onSelectEmoji = useCallback(
    (emojiAlias) => {
      selectEmoji(emojiSuggestKey, emojiAlias)(view.state, view.dispatch, view);
    },
    [view, emojiSuggestKey],
  );

  return (
    <div
      className="bangle-emoji-suggest-container"
      style={{
        width: containerWidth,
      }}
    >
      {filteredEmojis.map(([emojiAlias, emoji], i) => {
        return (
          <Row
            key={emojiAlias}
            scrollIntoViewIfNeeded={true}
            isSelected={activeIndex === i}
            emoji={emoji}
            emojiAlias={emojiAlias}
            onSelectEmoji={onSelectEmoji}
            style={{
              margin: squareMargin,
              width: squareSide,
              height: squareSide,
              lineHeight: squareSide + 'px',
              fontSize: squareSide - 4,
            }}
          />
        );
      })}
    </div>
  );
}

const Row = React.memo(function Row({
  isSelected,
  emoji,
  emojiAlias,
  scrollIntoViewIfNeeded = true,
  onSelectEmoji,
  style,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (scrollIntoViewIfNeeded && isSelected && ref.current) {
      if ('scrollIntoViewIfNeeded' in document.body) {
        ref.current.scrollIntoViewIfNeeded(false);
      } else if (ref.current.scrollIntoView) {
        ref.current.scrollIntoView(false);
      }
    }
  }, [scrollIntoViewIfNeeded, isSelected]);

  return (
    <button
      className={`bangle-emoji-square ${
        isSelected ? 'bangle-is-selected' : ''
      }`}
      onClick={(e) => {
        e.preventDefault();
        onSelectEmoji(emojiAlias);
      }}
      ref={ref}
      style={style}
    >
      {emoji}
    </button>
  );
});
