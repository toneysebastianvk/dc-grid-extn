export function calculateGridPos(x, y, mousePos, dragPos) {
  return [
    x + Math.round((mousePos[0] - dragPos[0]) / 66),
    y + Math.round((mousePos[1] - dragPos[1]) / 66),
  ];
}

export function isGridPosValid(
  gridPos,
  size,
  pageBase,
  pageSize,
  items,
  item,
  cols,
  select,
  mode
) {
  const [x, y] = gridPos;
  const ex = x + size[0];
  const ey = y + size[1];
  const rows = Math.ceil(pageSize / cols);

  if (x < 0 || y < 0 || ex > cols || ey > rows) {
    return false;
  }

  // Check collision with other items

  for (let other of items) {
    if (other !== item && select(other, 'position') >= pageBase) {
      const [ox, oy] = getPosition(other, pageBase, items, cols, select, mode);

      const oex = ox + Number(select(other, 'cols'));
      const oey = oy + Number(select(other, 'rows'));

      if (!(x >= oex || y >= oey || ex <= ox || ey <= oy)) {
        return false;
      }
    }
  }

  return true;
}

export function findClosestUnreservedPosition(
  position,
  items,
  cols,
  totalCount,
  select,
  mode
) {
  const reserved = new Set();

  for (const item of items) {
    const icols = Number(select(item, 'cols'));
    const rows = Number(select(item, 'rows'));

    switch (mode) {
      case "absolute": {
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            reserved.add(position + x + y * cols);
          }
        }
        break;
      }
      case "wrap":
      case "wrap-simple": {
        const size = icols * rows;
        const position = select(item, 'position');

        if (mode === 'wrap-simple') {
          reserved.add(position)
          totalCount -= size - 1
        } else {
          for (let i = 0; i < size; i++) {
            reserved.add(position + i);
          }
        }

        break;
      }
      default:
        break;
    }
  }

  let offset = 0;
  while (position + offset < totalCount || position - offset >= 0) {
    if (position + offset < totalCount) {
      if (!reserved.has(position + offset)) {
        return position + offset;
      }
    }

    if (position - offset >= 0 && position - offset < totalCount) {
      if (!reserved.has(position - offset)) {
        return position - offset;
      }
    }

    offset++;
  }

  return -1;
}

// Item flow can vary depending on wrap mode:
// - absolute: index is based off of x/y position and not affected by other elements
// - wrap: multi-row items take up sequential index numbers, so a 2x2 item on a 3 column grid will take up (0,1,2,3) instead of (0,1,3,4).
//         the following indices wrap around the block in terms of position... 4 is (2, 0), 5 is (2, 1)
export function wrapPositionUpdate(
  item,
  gridPos,
  size,
  pageBase,
  pageSize,
  items,
  cols,
  select,
  set,
  mode = "absolute"
) {
  const [x, y] = gridPos;

  switch (mode) {
    case "absolute": {
      set(item, 'position', pageBase + x + y * cols);
      break;
    }
    case "wrap":
    case "wrap-simple": {
      const simple = mode === 'wrap-simple';
      items = items.filter((i) => i === item || (select(i, 'position') >= pageBase && select(i, 'position') < pageBase + pageSize));

      const itemWithPos = items.map((i) => ({
        item: i,
        pos: i === item ? gridPos : getPosition(i, pageBase, items, cols, select, mode),
      }));

      itemWithPos.sort((a, b) => a.pos[0] - b.pos[0]);
      itemWithPos.sort((a, b) => a.pos[1] - b.pos[1]);

      const maxY =
        itemWithPos.length > 0 ? itemWithPos[itemWithPos.length - 1].pos[1] : 0;
      const occupied = new Set();
      let position = 0;

      for (let yi = 0; yi <= maxY; yi++) {
        for (let xi = 0; xi < cols; xi++) {
          const absId = xi + yi * cols;
          if (!occupied.has(absId)) {
            for (let other of itemWithPos) {
              if (other.pos[0] === xi && other.pos[1] === yi) {
                set(other.item, 'position', position + pageBase);

                // Reserve spots for this item
                const oCols =
                  item === other.item ? size[0] : Number(select(other.item, 'cols'));
                const oRows =
                  item === other.item ? size[1] : Number(select(other.item, 'rows'));

                position += simple ? 0 : oCols * oRows - 1;

                for (let col = 0; col < oCols; col++) {
                  for (let row = 0; row < oRows; row++) {
                    occupied.add(xi + col + (yi + row) * cols);
                  }
                }
              }
            }

            position++;
          }
        }
      }
      break;
    }
    default:
      break;
  }
}

export function getPosition(item, pageBase, items, cols, select, mode = "absolute") {
  const gridIndex = select(item, 'position') - pageBase;

  switch (mode) {
    case "absolute": {
      const x = gridIndex % cols;
      const y = Math.floor(gridIndex / cols);
      return [x, y];
    }
    case "wrap":
    case "wrap-simple": {
      const simple = mode === 'wrap-simple';

      const maxValue = simple ? Infinity : Math.ceil(gridIndex / cols) + 1;
      const occupied = new Set();
      const itemPosition = select(item, 'position');
      let position = 0;

      for (let yi = 0; yi <= maxValue; yi++) {
        for (let xi = 0; xi < cols; xi++) {
          const absId = xi + yi * cols;
          if (!occupied.has(absId)) {
            if (itemPosition - pageBase === position) {
              return [xi, yi];
            }

            for (let other of items) {
              const otherPosition = select(other, 'position');
              if (
                item !== other &&
                otherPosition >= pageBase &&
                itemPosition > otherPosition
              ) {
                // Does the other item overlap this tile?

                if (position === (select(other, 'position') - pageBase)) {
                  // Reserve spots for this item
                  const oCols = Number(select(other, 'cols'));
                  const oRows = Number(select(other, 'rows'));

                  position += simple ? 0 : oCols * oRows - 1;

                  for (let col = 0; col < oCols; col++) {
                    for (let row = 0; row < oRows; row++) {
                      occupied.add(xi + col + (yi + row) * cols);
                    }
                  }

                  break;
                }
              }
            }

            position++;
          }
        }
      }

      return [0, 0];
    }
    default:
      return [0, 0];
  }
}
