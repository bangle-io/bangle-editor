/**
 * @jest-environment jsdom
 */
/** @jsx pjsx */
import {
  pjsx,
  reactTestEditor,
} from '@bangle.dev/react/__tests__/helpers/index';
import { EmojiSuggestContainer } from '../EmojiSuggest';
import { render as _render, fireEvent, act } from '@testing-library/react';

describe('EmojiSuggestContainer', () => {
  let renderResult,
    view,
    rowWidth,
    squareMargin,
    squareSide,
    emojiSuggestKey,
    getEmojis,
    maxItems,
    triggerText,
    counter;

  beforeEach(() => {
    view = jest.fn();
    rowWidth = 400;
    squareMargin = 2;
    squareSide = 8;
    emojiSuggestKey = jest.fn();
    getEmojis = (query) => {
      const data = [
        ['grinning', '😀'],
        ['smiley', '😃'],
        ['smile', '😄'],
      ];
      return query
        ? data.filter((r) => r[0].includes(query) || query.includes(r[0]))
        : [];
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
        getEmojis={getEmojis}
        maxItems={maxItems}
        triggerText={triggerText}
        counter={counter}
      />,
    );
  };

  test('renders correctly when no maatch', async () => {
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
          <button
            class="bangle-emoji-square bangle-is-selected"
            style="margin: 2px; width: 8px; height: 8px; line-height: 8px; font-size: 4px;"
          >
            😃
          </button>
          <button
            class="bangle-emoji-square "
            style="margin: 2px; width: 8px; height: 8px; line-height: 8px; font-size: 4px;"
          >
            😄
          </button>
        </div>
      </div>
    `);
  });
});
