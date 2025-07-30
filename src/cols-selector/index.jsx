import "./cols-selector.css";
import React from "react";
import { useExtension } from "../extension-context";
import clsx from "clsx";

export default function ColsSelector() {
  let {
    cols,
    setColVariant,
    params: {
      cols: colsArray
    }
  } = useExtension();

  if (!Array.isArray(colsArray)) {
    return <></>
  }

  const columnButtons = [];

  for (let i = 0; i < colsArray.length; i++) {
    const num = i;
    columnButtons.push(
      <button onClick={() => {setColVariant(num)}} key={i} className={clsx({'col-current': colsArray[i] === cols})}>
        {colsArray[i]}
      </button>
    );
  }

  return (
    <div className="cols-selector">
      Columns: {columnButtons}
    </div>
  );
}
