import "./grid-space.css";
import React from "react";
import { useState } from "react";

export default function GridSpace({ index, cols, onCreate }) {
  const [hovered, setHovered] = useState(false);

  const createItem = () => {
    const x = index % cols;
    const y = Math.floor(index / cols);

    onCreate(x, y);
  }

  const gridColumnStart = (index % cols) + 1;
  const gridRowStart = Math.floor(index / cols) + 1;
  const gridColumnEnd = gridColumnStart + 1;
  const gridRowEnd = gridRowStart + 1;

  const style = {
    gridColumnStart,
    gridRowStart,
    gridColumnEnd,
    gridRowEnd,
  };

  const plusStyle = {
    transition: "opacity 0.33s",
    opacity: hovered ? 1 : 0.25,
  };

  return (
    <div
      className="grid-space"
      style={style}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={createItem}
    >
      <span style={plusStyle}>+</span>
    </div>
  );
}
