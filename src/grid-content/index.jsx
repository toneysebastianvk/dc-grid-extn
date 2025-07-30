import "./grid-content.css";
import { useState } from "react";
import { useExtension } from "../extension-context";
import clsx from "clsx";
import { useCallback } from "react";
import React from "react";
import { calculateGridPos, getPosition, isGridPosValid, wrapPositionUpdate } from "../utils/grid-utils";

const ResizeMode = {
  None: 0,
  Left: 1,
  Right: 2,
  Top: 3,
  Bottom: 4,
  Drag: 5,
};

export default function GridContent({ items, index, pageBase, pageSize, cols, onPageChange }) {
  const { selectedIndex, setSelectedIndex, setField, params, dragState, setDragState, select, set, rowColCast } = useExtension();

  const item = items[index];
  const pos = select(item, 'position');

  let pageOffset = 0;

  if (pos < pageBase || pos >= pageBase + pageSize) {
    pageOffset = pageBase;
    pageBase = Math.floor(pos / pageSize) * pageSize;
    pageOffset = pageOffset - pageBase;
  }

  const [x, y] = getPosition(item, pageBase, items, cols, select, params.mode);

  const gridColumnStart = x + 1;
  const gridRowStart = y + 1;
  const gridColumnEnd = gridColumnStart + Number(select(item, 'cols'));
  const gridRowEnd = gridRowStart + Number(select(item, 'rows'));

  let [resizeMode, setResizeMode] = useState(ResizeMode.None);
  const [rect, setRect] = useState(undefined);
  const [mousePos, setMousePos] = useState([0, 0]);
  const [dragPos, setDragPos] = useState([0, 0]);
  const [pageSwitchState] = useState({});

  const selectIndex = useCallback(() => {
    setSelectedIndex(index);
  }, [index, setSelectedIndex]);

  const pdResize = (evt) => {
    const target = evt.currentTarget;

    switch (target.id) {
      case "left":
        setResizeMode(ResizeMode.Left);
        break;
      case "right":
        setResizeMode(ResizeMode.Right);
        break;
      case "top":
        setResizeMode(ResizeMode.Top);
        break;
      case "bottom":
        setResizeMode(ResizeMode.Bottom);
        break;
      case "drag":
        selectIndex();
        setDragPos([evt.pageX, evt.pageY]);
        setResizeMode(ResizeMode.Drag);
        setDragState({item, page: pageBase/pageSize, index});
        pageSwitchState.switchDir = 0;
        break;
      default:
        break;
    }

    setRect(target.parentElement.getBoundingClientRect());
    setMousePos([evt.pageX, evt.pageY]);
    target.setPointerCapture(evt.pointerId);
    evt.stopPropagation();
  };

  const puResize = (evt) => {
    if (resizeMode !== ResizeMode.None) {
      // Get grid alignment for mouse, relative to current position.
      const gridPosDiff = [
        Math.round((mousePos[0] - rect.left) / 66),
        Math.round((mousePos[1] - rect.top) / 66),
      ];

      let [x, y] = getPosition(item, pageBase, items, cols, select, params.mode);
      let rows = Number(select(item, 'rows'));
      let icols = Number(select(item, 'cols'));

      switch (resizeMode) {
        case ResizeMode.Left:
          gridPosDiff[0] = Math.max(
            -x,
            Math.min(gridPosDiff[0], icols - 1)
          );
          x += gridPosDiff[0];
          icols = icols - gridPosDiff[0];
          break;

        case ResizeMode.Right:
          gridPosDiff[0] = Math.max(1, Math.min(gridPosDiff[0], cols - x));
          icols = gridPosDiff[0];
          break;

        case ResizeMode.Top:
          gridPosDiff[1] = Math.max(
            -y,
            Math.max(
              Math.min(gridPosDiff[1], rows - 1),
              rows - 3
            )
          );
          y += gridPosDiff[1];
          rows = rows - gridPosDiff[1];
          break;

        case ResizeMode.Bottom:
          gridPosDiff[1] = Math.max(1, Math.min(gridPosDiff[1], 3));
          rows = gridPosDiff[1];
          break;

        case ResizeMode.Drag: 
          [x, y] = calculateGridPos(x, y, mousePos, dragPos);
          break;

        default:
          break;
      }

      const valid = isGridPosValid([x, y], [icols, rows], pageBase + pageOffset, pageSize, items, item, cols, select, params.mode);

      if (valid) {
        if (pageOffset !== 0) {
          wrapPositionUpdate(item, [-1, 0], [icols, rows], pageBase, pageSize, items, cols, select, set, params.mode);
          set(item, 'position', Infinity);
        }

        wrapPositionUpdate(item, [x, y], [icols, rows], pageBase + pageOffset, pageSize, items, cols, select, set, params.mode);
        set(item, 'rows', rowColCast(rows));
        set(item, 'cols', rowColCast(icols));
        setField();
      }

      resizeMode = ResizeMode.None;
      setResizeMode(ResizeMode.None);

      if (dragState) {
        setDragState(undefined);
      }
    }
  };

  const pmResize = (evt) => {
    if (resizeMode !== ResizeMode.None) {
      setMousePos([evt.pageX, evt.pageY]);
    }
  };

  let transform;
  let transformOrigin;
  let invTransform;
  let filter;
  let zIndex;

  if (resizeMode !== ResizeMode.None) {
    zIndex = 2;

    switch (resizeMode) {
      case ResizeMode.Left:
        const scaleL = (rect.right - mousePos[0]) / rect.width;
        transform = `scale(${scaleL}, 1)`;
        invTransform = `scale(${1 / scaleL}, 1)`;
        transformOrigin = "right";
        break;

      case ResizeMode.Right:
        const scaleR = (mousePos[0] - rect.left) / rect.width;
        transform = `scale(${scaleR}, 1)`;
        invTransform = `scale(${1 / scaleR}, 1)`;
        transformOrigin = "left";
        break;

      case ResizeMode.Top:
        const scaleT = (rect.bottom - mousePos[1]) / rect.height;
        transform = `scale(1, ${scaleT})`;
        invTransform = `scale(1, ${1 / scaleT})`;
        transformOrigin = "bottom";
        break;

      case ResizeMode.Bottom:
        const scaleB = (mousePos[1] - rect.top) / rect.height;
        transform = `scale(1, ${scaleB})`;
        invTransform = `scale(1, ${1 / scaleB})`;
        transformOrigin = "top";
        break;

      case ResizeMode.Drag:
        transform = `translate(${mousePos[0] - dragPos[0]}px, ${
          mousePos[1] - dragPos[1]
        }px)`;
        const newPos = calculateGridPos(x, y, mousePos, dragPos);
        const valid = isGridPosValid(newPos, [Number(select(item, 'cols')), Number(select(item, 'rows'))], pageBase + pageOffset, pageSize, items, item, cols, select, params.mode);

        filter = valid ? "grayscale(0%)" : "grayscale(100%)";

        if (params.paginated) {
          const switchDir = (newPos[0] < -1 || mousePos[0] <= -34) ? -1 : ((newPos[0] > cols) ? 1 : 0);

          if (switchDir !== pageSwitchState.switchDir) {
            switch (switchDir) {
              case -1:
                if (pageBase + pageOffset > 0) {
                  onPageChange(Math.round((pageBase + pageOffset) / pageSize) - 1);
                }
                break;
              case 1:
                if ((pageBase + pageOffset) / pageSize < params.pageCount - 1) {
                  onPageChange(Math.round((pageBase + pageOffset) / pageSize) + 1);
                }
                break;
              default:
                break;
            }

            pageSwitchState.switchDir = switchDir;
          }
        }

        break;

      default:
        break;
    }
  }

  const style = {
    gridColumnStart,
    gridRowStart,
    gridColumnEnd,
    gridRowEnd,
    transform,
    transformOrigin,
    filter,
    zIndex
  };

  return (
    <div
      className={clsx("grid-content", {
        "grid-content-selected": selectedIndex === index,
      })}
      id="drag"
      style={style}
      onPointerDown={pdResize}
      onPointerUp={puResize}
      onPointerMove={pmResize}
    >
      <div
        id="left"
        className="grid-content-grab grid-content-grab-left"
        onPointerDown={pdResize}
        onPointerUp={puResize}
        onPointerMove={pmResize}
      ></div>
      <div
        id="right"
        className="grid-content-grab grid-content-grab-right"
        onPointerDown={pdResize}
        onPointerUp={puResize}
        onPointerMove={pmResize}
      ></div>
      <div
        id="top"
        className="grid-content-grab grid-content-grab-top"
        onPointerDown={pdResize}
        onPointerUp={puResize}
        onPointerMove={pmResize}
      ></div>
      <div
        id="bottom"
        className="grid-content-grab grid-content-grab-bottom"
        onPointerDown={pdResize}
        onPointerUp={puResize}
        onPointerMove={pmResize}
      ></div>
      <span style={{ transform: invTransform }}>{item.tempId}</span>
    </div>
  );
}
