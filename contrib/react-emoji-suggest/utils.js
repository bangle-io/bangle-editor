const emptyValue = { item: undefined, coords: undefined };

function counterToCoords(counter, namedGroups) {
  const groups = toGroups(namedGroups);
  counter = normalizeCounter(counter, groups);
  if (counter == null) {
    return;
  }

  for (let i = 0; i < groups.length; i++) {
    const size = groups[i].length;
    if (counter < size) {
      return [i, counter];
    }
    counter = counter - size;
  }
}

/**
 * Converted 2d coordinates in a flat 1d integer referred everywhere as counter.
 * @param {Array[number, number]} coords The 2d coordinates to find an emoji
 * @param {Array<{name: string, emojis: string[]}>} namedGroups
 * @returns
 */
export function coordsToCounter(coords, namedGroups) {
  const groups = toGroups(namedGroups);
  let counter = 0;
  for (let i = 0; i < coords[0]; i++) {
    counter += groups[i].length;
  }
  counter += coords[1];

  return counter;
}

export function resolveCounter(counter, namedGroups) {
  const coords = counterToCoords(counter, namedGroups);
  if (!coords) {
    return emptyValue;
  }
  const groups = toGroups(namedGroups);
  return { item: groups[coords[0]][coords[1]], coords: coords };
}

/**
 * Helps calculate the position resulting from a jump between rows
 *
 * @param {*} counter
 * @param {1, -1} direction up or down
 * @param {*} jump the positive integer value to offset the counter by
 * @param {*} namedGroups
 * @returns a new counter
 */
export function resolveRowJump(counter, direction = 1, jump, namedGroups) {
  const { coords } = jumpRow(counter, direction, jump, namedGroups);
  if (coords == null) {
    return null;
  }

  return coordsToCounter(coords, namedGroups);
}

function getNextGroup(groupIndex, groups, direction = 1) {
  let newIndex = groupIndex + direction;
  if (groups.length === 0) {
    return;
  }
  while (newIndex < 0) {
    newIndex += groups.length;
  }

  newIndex = newIndex % groups.length;

  return newIndex;
}

export function getSquareDimensions({ rowWidth, squareMargin, squareSide }) {
  const squareFullWidth = squareSide + 2 * squareMargin;
  // -2 to account for borders and safety
  const rowCount = Math.floor((rowWidth - 2) / squareFullWidth);
  const containerWidth = rowCount * squareFullWidth;

  return {
    containerWidth,
    rowCount,
  };
}

export function jumpRow(counter, direction = 1, jump, namedGroups) {
  const coords = counterToCoords(counter, namedGroups);

  if (!coords) {
    return emptyValue;
  }

  const groups = toGroups(namedGroups);
  const groupIndex = coords[0];
  const itemIndex = coords[1];
  const groupSize = groups[groupIndex].length;
  const newIndex = direction === 1 ? itemIndex + jump : itemIndex - jump;

  if (newIndex < groupSize && newIndex >= 0) {
    return {
      item: groups[groupIndex][newIndex],
      coords: [groupIndex, newIndex],
    };
  }

  const nextGroupIndex = getNextGroup(
    groupIndex,
    groups,
    newIndex >= groupSize ? 1 : -1,
  );

  if (nextGroupIndex == null) {
    return emptyValue;
  }

  const nextGroup = groups[nextGroupIndex];
  const nextItemIndex = direction === 1 ? 0 : nextGroup.length - 1;

  const item = nextGroup[nextItemIndex];

  if (item == null) {
    return emptyValue;
  }

  return {
    item,
    coords: [nextGroupIndex, nextItemIndex],
  };
}

function toGroups(namedGroups) {
  return namedGroups.map((r) => r.emojis);
}

function normalizeCounter(counter, groups) {
  const totalSize = groups.reduce((prev, cur) => prev + cur.length, 0);
  if (totalSize === 0) {
    return;
  }
  while (counter < 0) {
    counter += totalSize;
  }
  counter = counter % totalSize;

  return counter;
}
