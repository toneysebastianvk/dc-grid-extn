import "./pagination.css";
import React from "react";
import { useExtension } from "../extension-context";

export default function Pagination({ pageNum, onChange }) {
  let {
    cols,
    params: {
      paginated,
      pageCount
    }
  } = useExtension();

  if (!paginated) {
    return <></>
  }

  const incrementPage = (amount) => {
    const newPage = pageNum + amount;

    if (newPage >= 0 && newPage < pageCount) {
      onChange(newPage);
    }
  };

  const prePages = [];
  const afterPages = [];

  const navRange = 4;

  for (let i = pageNum - 1; i >= 0 && i > pageNum - navRange; i--) {
    const num = i;
    prePages.push(
      <button onClick={() => onChange(num)} key={i}>
        {i}
      </button>
    );
  }

  for (let i = pageNum + 1; i < pageCount && i < pageNum + navRange; i++) {
    const num = i;
    afterPages.push(
      <button onClick={() => onChange(num)} key={i}>
        {i}
      </button>
    );
  }

  const style = {
    minWidth: cols * 60 + 6 * (cols - 1) + "px",
  };

  return (
    <div className="pagination" style={style}>
      <button onClick={() => incrementPage(-1)}>&lt;</button>
      <div className="pagination-list">
        <div className="pagination-fill-l">{prePages}</div>
        <div className="pagination-current">{pageNum}</div>
        <div className="pagination-fill-r">{afterPages}</div>
      </div>
      <button onClick={() => incrementPage(1)}>&gt;</button>
    </div>
  );
}
