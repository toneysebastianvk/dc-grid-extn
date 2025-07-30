import React, { useEffect, useState, useContext } from "react";
import {
  findClosestUnreservedPosition,
  wrapPositionUpdate,
} from "../utils/grid-utils";
import { getSdk } from "./extension-sdk";

const defaultParams = {
  cols: 3,
  pageSize: 24,
  mode: "absolute",
  paginated: true,
  pageCount: 100,
};

const defaultSelector = (obj, field) => {
  return obj[field];
};

const defaultSetter = (obj, field, value) => {
  obj[field] = value;
};

const indexedSelector = (index) => (obj, field) => {
  return Array.isArray(obj[field]) ? obj[field][index] : obj[field];
};

const indexedSetter = (index, count) => (obj, field, value) => {
  if (!Array.isArray(obj[field])) {
    const originalValue = obj[field];
    obj[field] = [];

    for (let i = 0; i < count; i++) {
      obj[field][i] = originalValue;
    }
  }

  obj[field][index] = value;
};

const defaultExtensionState = {
  selectedIndex: -1,
  setSelectedIndex: null,
  cols: 3,
  select: defaultSelector,
  set: defaultSetter,
  rowColCast: Number,
  params: {
    ...defaultParams,
  },
};

const ExtensionContext = React.createContext();

const mapContentTypes = (types) => {
  const result = {
    cards: {},
    icons: {},
  };

  if (types != null) {
    for (let type of types) {
      if (type.card) result.cards[type.id] = type.card;
      if (type.icon) result.icons[type.id] = type.icon;
    }
  }

  return result;
};

export function ExtensionContextProvider({ children }) {
  const [state, setState] = useState(defaultExtensionState);

  useEffect(() => {
    getSdk().then(async (sdk) => {
      sdk.frame.startAutoResizer();
      const field = await sdk.field.getValue();
      const schema = sdk.field.schema;
      const itemSchema = schema.items;
      const params = {
        title: schema.title,
        ...defaultParams,
        ...sdk.params.installation,
        ...sdk.params.instance,
      };
      const contentTypes = mapContentTypes(params.contentTypes);

      if (params.mode === "wrap-simple") {
        params.paginated = false;
      }

      if (!params.paginated) {
        params.pageCount = 1;
      }

      const totalCount = params.pageSize * params.pageCount;

      schema["ui:extension"].params.contentTypes = contentTypes;

      const rowColCast =
        (itemSchema.properties.rows.items?.type ??
          itemSchema.properties.rows.type) === "string"
          ? String
          : Number;

      // Remove properties managed by grid placement
      delete itemSchema.properties.rows;
      delete itemSchema.properties.cols;
      delete itemSchema.properties.position;

      itemSchema["ui:extension"] = {
        params: {
          contentTypes,
        },
      };

      let tempId = 0;
      for (let item of field) {
        item.tempId = tempId++;
      }

      let messageId = 0;

      let state = {
        ...defaultExtensionState,
        field,
        itemSchema,
        sdk,
        params,
        contentTypes: mapContentTypes(params.contentTypes),
        rowColCast,
        tempId,
      };

      if (Array.isArray(params.cols)) {
        state.cols = params.cols[params.cols.length - 1];
        state.select = indexedSelector(params.cols.length - 1);
        state.set = indexedSetter(params.cols.length - 1, params.cols.length);
      } else {
        state.cols = params.cols;
      }

      state.setSelectedIndex = (index) => {
        state.selectedIndex = index;

        state = { ...state };
        setState(state);
      };

      state.setField = () => {
        const selectedItem = state.field[state.selectedIndex];

        const select = state.select;

        state.field.sort(
          (a, b) => select(a, "position") - select(b, "position")
        );

        if (selectedItem) {
          state.setSelectedIndex(state.field.indexOf(selectedItem));
        }

        sdk.field.setValue(state.field);
      };

      state.createItem = (x, y, pageBase, cols) => {
        const newItem = {
          position: Infinity,
          rows: rowColCast(1),
          cols: rowColCast(1),
          tempId: state.tempId++,
        };

        // Generate a position for the new item.
        state.field.push(newItem);
        wrapPositionUpdate(
          newItem,
          [x, y],
          [1, 1],
          pageBase,
          state.params.pageSize,
          state.field,
          cols,
          state.select,
          state.set,
          state.params.mode
        );

        const oobCols = [];

        if (Array.isArray(state.params.cols)) {
          // Set a position for the other column modes that is close to the target, but isn't taken.
          newItem.rows = [];
          newItem.cols = [];

          const currentIndex = state.params.cols.indexOf(state.cols);
          for (let i = 0; i < state.params.cols.length; i++) {
            newItem.rows[i] = rowColCast(1);
            newItem.cols[i] = rowColCast(1);

            if (i !== currentIndex) {
              newItem.position[i] = findClosestUnreservedPosition(
                newItem.position[currentIndex],
                state.field,
                state.params.cols[i],
                totalCount,
                indexedSelector(i),
                state.params.mode
              );
              if (newItem.position[i] === -1) {
                oobCols.push(state.params.cols[i]);
              }
            }
          }
        }

        state.setField();

        state.setSelectedIndex(state.field.indexOf(newItem));

        if (oobCols.length > 0) {
          state.deleteSelectedItem();
          state.setMessage(
            `Couldn't create grid item: Doesn't fit on columns (${oobCols.join(
              ", "
            )}).`
          );
        }
      };

      state.deleteSelectedItem = () => {
        if (state.selectedIndex >= 0) {
          const item = state.field[state.selectedIndex];

          if (Array.isArray(state.params.cols)) {
            for (let i = 0; i < state.params.cols.length; i++) {
              const select = indexedSelector(i);
              const set = indexedSetter(i, state.params.cols.length);
              wrapPositionUpdate(
                item,
                [-1, 0],
                [1, 1],
                Math.floor(select(item, "position") / state.params.pageSize),
                state.params.pageSize,
                state.field,
                state.params.cols[i],
                select,
                set,
                state.params.mode
              );
            }
          } else {
            wrapPositionUpdate(
              item,
              [-1, 0],
              [1, 1],
              Math.floor(
                state.select(item, "position") / state.params.pageSize
              ),
              state.params.pageSize,
              state.field,
              state.cols,
              state.select,
              state.set,
              state.params.mode
            );
          }
          state.field.splice(state.selectedIndex, 1);
          state.setSelectedIndex(-1);
          state.setField();
        }
      };

      state.setDragState = (dragState) => {
        state.dragState = dragState;

        state = { ...state };
        setState(state);
      };

      state.setColVariant = (num) => {
        state.cols = state.params.cols[num];

        const prevItem = state.field[state.selectedIndex];

        state.select = indexedSelector(num);
        state.set = indexedSetter(num, params.cols.length);
        state.field.sort(
          (a, b) => state.select(a, "position") - state.select(b, "position")
        );

        if (prevItem) {
          state.selectedIndex = state.field.indexOf(prevItem);
        }

        state = { ...state };
        setState(state);
      };

      state.setMessage = (message) => {
        state.message = message;
        state.messageId = ++messageId;

        state = { ...state };
        setState(state);
      }

      setState({ ...state });
    });
  }, [setState]);

  return (
    <ExtensionContext.Provider value={state}>
      {children}
    </ExtensionContext.Provider>
  );
}

export function useExtension() {
  return useContext(ExtensionContext);
}
