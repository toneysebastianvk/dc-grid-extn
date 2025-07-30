import "./grid.css";
import GridSpace from "../grid-space";
import GridContent from "../grid-content";
import React from "react";
import { useExtension } from "../extension-context";
import clsx from "clsx";

export default function Grid({
  pageNum,
  onPageChange,
}) {
  const {
    field: items,
    createItem,
    dragState,
    cols,
    select,
    params: { pageSize, pageCount },
  } = useExtension();

  const width = cols * 60 + (cols - 1) * 6 + "px";
  const gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

  const pageBase = pageNum * pageSize;

  const createItemCallback = (x, y) => {
    createItem(x, y, pageBase, cols);
  };

  const gridSpaces = Array(pageSize)
    .fill(0)
    .map((_, i) => (
      <GridSpace
        index={i}
        key={i}
        cols={cols}
        onCreate={createItemCallback}
      ></GridSpace>
    ));

  // Try select grid items that are on this page
  const pageItems = (items ?? [])
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item }) => {
        const pos = select(item, 'position');
        return pos >= pageBase && pos < pageBase + pageSize;
      }
    );

  if (
    dragState &&
    dragState.item &&
    pageItems.findIndex(({ item }) => item === dragState.item) === -1
  ) {
    pageItems.push({ item: dragState.item, index: dragState.index });
  }

  const gridItems = pageItems.map(({ item, index }) => (
    <GridContent
      items={items}
      index={index}
      cols={cols}
      pageBase={pageBase}
      pageSize={pageSize}
      key={`s${index}-${select(item, 'position')}`}
      onPageChange={onPageChange}
    ></GridContent>
  ));

  return (
    <div className="grid-container">
      <div className="grid" style={{ width, gridTemplateColumns }}>
        {gridSpaces}
        {gridItems}
      </div>
      <div className={clsx(["grid-page", "grid-page-left"], { "hidden": dragState == null || pageNum === 0 })}>&lt;</div>
      <div className={clsx(["grid-page", "grid-page-right"], { "hidden": dragState == null || pageNum === pageCount - 1 })}>&gt;</div>
    </div>
  );
}
