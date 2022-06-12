import React, { useCallback, useMemo } from 'react';
import reactDOM from 'react-dom';

import type { EditorView } from '@bangle.dev/pm';
import { PluginKey } from '@bangle.dev/pm';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';

import { GetEmojiGroupsType, selectEmoji } from './emoji-suggest';
import { getSquareDimensions, resolveCounter } from './utils';

export function EmojiSuggest({
  emojiSuggestKey,
}: {
  emojiSuggestKey: PluginKey;
}) {
  const view = useEditorViewContext();
  const {
    tooltipContentDOM,
    getEmojiGroups,
    maxItems,
    squareSide,
    squareMargin,
    rowWidth,
    selectedEmojiSquareId,
    suggestTooltipKey,
  } = usePluginState(emojiSuggestKey);
  const {
    counter,
    triggerText,
    show: isVisible,
  } = usePluginState(suggestTooltipKey);

  return reactDOM.createPortal(
    <div className="bangle-emoji-suggest">
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
            maxItems={maxItems}
            emojiSuggestKey={emojiSuggestKey}
            getEmojiGroups={getEmojiGroups}
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
  maxItems,
}: {
  view: EditorView;
  rowWidth: number;
  squareMargin: number;
  squareSide: number;
  emojiSuggestKey: PluginKey;
  getEmojiGroups: GetEmojiGroupsType;
  triggerText: string;
  counter: number;
  selectedEmojiSquareId: string;
  maxItems: number;
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
    (emojiAlias: string) => {
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
              {emojis.slice(0, maxItems).map(([emojiAlias, emoji]) => (
                <EmojiSquare
                  key={emojiAlias}
                  isSelected={activeItem?.[0] === emojiAlias}
                  emoji={emoji}
                  emojiAlias={emojiAlias}
                  onSelectEmoji={onSelectEmoji}
                  selectedEmojiSquareId={selectedEmojiSquareId}
                  style={{
                    margin: squareMargin,
                    width: squareSide,
                    height: squareSide,
                    lineHeight: squareSide + 'px',
                    fontSize: Math.max(squareSide - 7, 4),
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
}: {
  isSelected: boolean;
  emoji: string;
  emojiAlias: string;
  onSelectEmoji: (alias: string) => void;
  style: any;
  selectedEmojiSquareId: string;
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
