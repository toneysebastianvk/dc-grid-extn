import "./empty-editor.css";
import React from "react";

export default function EmptyEditor() {
  return (
    <div class="empty-editor">
      <h2>No Selected Item</h2>
      <p>
        Click an existing grid item to edit its properties, or an empty space to add a new one.
      </p>
    </div>
  );
}
