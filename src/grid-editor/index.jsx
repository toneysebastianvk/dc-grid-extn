import { useExtension } from "../extension-context";
import "./editor.css";
import {
  Editor,
  getDefaultRegistry,
  SdkContext,
  withTheme,
} from "unofficial-dynamic-content-ui";
import React from "react";
import EmptyEditor from "../empty-editor";

const registry = getDefaultRegistry();

export default function GridEditor() {
  const {
    selectedIndex,
    field,
    itemSchema,
    sdk,
    setField,
    deleteSelectedItem,
  } = useExtension();

  const updateField = (newValue) => {
    if (selectedIndex !== -1) {
      field[selectedIndex] = newValue;
      setField();
    }
  };

  if (itemSchema == null || !(selectedIndex >= 0)) {
    return <EmptyEditor />;
  }

  const selected = field[selectedIndex];

  console.log("selectedselectedselectedselected= ", {itemSchema, selected, registry});

  return (
    <div className="editor">
      <div className="editor-clip">
        <button className="delete-button" onClick={deleteSelectedItem}>
          🗑️
        </button>
        <SdkContext.Provider value={{ sdk }}>
          {withTheme(
            <Editor
              key={`${selected.tempId}`}
              schema={itemSchema}
              value={selected}
              registry={registry}
              onChange={updateField}
            />
          )}
        </SdkContext.Provider>
      </div>
    </div>
  );
}
