import reactDOM from 'react-dom';
import React, { useCallback, useMemo } from 'react';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { getSuggestTooltipKey, selectEmoji } from './emoji-suggest';
import { resolveCounter, getSquareDimensions } from './utils';

export function EmojiSuggest({ emojiSuggestKey }) {
  const {
    counter,
    triggerText,
    show: isVisible,
  } = usePluginState(getSuggestTooltipKey(emojiSuggestKey));
  const view = useEditorViewContext();
  const {
    tooltipContentDOM,
    getEmojiGroups,
    maxItems,
    squareSide,
    squareMargin,
    rowWidth,
    palettePadding,
    selectedEmojiSquareId,
  } = usePluginState(emojiSuggestKey);

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
            getEmojiGroups={getEmojiGroups}
            maxItems={maxItems}
            triggerText={triggerText}
            counter={counter}
            selectedEmojiSquareId={selectedEmojiSquareId}
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
  getEmojiGroups,
  triggerText,
  counter,
  selectedEmojiSquareId,
}) {
  const emojiGroups = useMemo(
    () => getEmojiGroups(triggerText),
    [getEmojiGroups, triggerText],
  );
  const { containerWidth } = getSquareDimensions({
    rowWidth,
    squareMargin,
    squareSide,
  });

  const { item: activeItem } = resolveCounter(counter, emojiGroups);
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
      {emojiGroups.map(({ name: groupName, emojis }, i) => {
        return (
          <div className="bangle-emoji-suggest-group" key={groupName || i}>
            {groupName && <span>{groupName}</span>}
            <div>
              {emojis.map(([emojiAlias, emoji], j) => (
                <EmojiSquare
                  key={emojiAlias}
                  isSelected={activeItem[0] === emojiAlias}
                  emoji={emoji}
                  emojiAlias={emojiAlias}
                  onSelectEmoji={onSelectEmoji}
                  selectedEmojiSquareId={selectedEmojiSquareId}
                  style={{
                    margin: squareMargin,
                    width: squareSide,
                    height: squareSide,
                    lineHeight: squareSide + 'px',
                    fontSize: squareSide - 4,
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmojiSquare({
  isSelected,
  emoji,
  emojiAlias,
  onSelectEmoji,
  style,
  selectedEmojiSquareId,
}) {
  return (
    <button
      className={`bangle-emoji-square ${
        isSelected ? 'bangle-is-selected' : ''
      }`}
      id={isSelected ? selectedEmojiSquareId : undefined}
      onClick={(e) => {
        e.preventDefault();
        onSelectEmoji(emojiAlias);
      }}
      style={style}
    >
      {emoji}
    </button>
  );
}
