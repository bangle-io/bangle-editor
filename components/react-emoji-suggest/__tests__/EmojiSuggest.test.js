/**
 * @jest-environment jsdom
 */
/** @jsx pjsx */
import { render as _render } from '@testing-library/react';

import { pjsx } from '@bangle.dev/react/__tests__/helpers/index';

import { EmojiSuggestContainer } from '../src/EmojiSuggest';

describe('EmojiSuggestContainer', () => {
  let view,
    rowWidth,
    squareMargin,
    squareSide,
    emojiSuggestKey,
    getEmojiGroups,
    maxItems,
    triggerText,
    counter;

  beforeEach(() => {
    view = jest.fn();
    rowWidth = 400;
    squareMargin = 2;
    squareSide = 8;
    emojiSuggestKey = jest.fn();
    getEmojiGroups = (query) => {
      const data = [
        { name: 'a-1', emojis: [['grinning', '😀']] },
        { name: 'a-2', emojis: [['smiley', '😃']] },
        { name: 'a-3', emojis: [['smile', '😄']] },
      ];

      if (!query) {
        return [];
      }

      return data
        .map((group) => {
          return {
            ...group,
            emojis: group.emojis.filter(
              ([alias]) => alias.includes(query) || query.includes(alias),
            ),
          };
        })
        .filter((r) => r.emojis.length > 0);
    };
    maxItems = Infinity;
    triggerText = 'no match';
    counter = 2;
  });

  const render = () => {
    return _render(
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
        selectedEmojiSquareId="abcd-123"
      />,
    );
  };

  test('renders correctly when no match', async () => {
    expect(render().container).toMatchInlineSnapshot(`
      <div>
        <div
          class="bangle-emoji-suggest-container"
          style="width: 396px;"
        />
      </div>
    `);
  });

  test('correct width 1', async () => {
    rowWidth = 395;

    expect(render().container).toMatchInlineSnapshot(`
      <div>
        <div
          class="bangle-emoji-suggest-container"
          style="width: 384px;"
        />
      </div>
    `);
  });

  test('correct width 2', async () => {
    rowWidth = 396;

    expect(render().container).toMatchInlineSnapshot(`
      <div>
        <div
          class="bangle-emoji-suggest-container"
          style="width: 384px;"
        />
      </div>
    `);
  });

  test('correct width 3', async () => {
    rowWidth = 397;

    expect(render().container).toMatchInlineSnapshot(`
      <div>
        <div
          class="bangle-emoji-suggest-container"
          style="width: 384px;"
        />
      </div>
    `);
  });

  test('correct width 4', async () => {
    rowWidth = 398;

    expect(render().container).toMatchInlineSnapshot(`
      <div>
        <div
          class="bangle-emoji-suggest-container"
          style="width: 396px;"
        />
      </div>
    `);
  });

  test('renders correctly when there is a match', async () => {
    triggerText = 'sm';
    expect(render().container).toMatchInlineSnapshot(`
      <div>
        <div
          class="bangle-emoji-suggest-container"
          style="width: 396px;"
        >
          <div
            class="bangle-emoji-suggest-group"
          >
            <span>
              a-2
            </span>
            <div>
              <button
                class="bangle-emoji-square bangle-is-selected"
                id="abcd-123"
                style="margin: 2px; width: 8px; height: 8px; line-height: 8px; font-size: 4px;"
              >
                😃
              </button>
            </div>
          </div>
          <div
            class="bangle-emoji-suggest-group"
          >
            <span>
              a-3
            </span>
            <div>
              <button
                class="bangle-emoji-square "
                style="margin: 2px; width: 8px; height: 8px; line-height: 8px; font-size: 4px;"
              >
                😄
              </button>
            </div>
          </div>
        </div>
      </div>
    `);
  });
});
