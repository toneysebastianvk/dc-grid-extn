import "./App.css";
import { useState } from "react";
import GridEditor from "./grid-editor";
import { ExtensionContextProvider } from "./extension-context";
import Grid from "./grid";
import Pagination from "./pagination";
import Title from "./title";
import React from "react";
import ColsSelector from "./cols-selector";
import Message from "./message";

function App() {
  let [pageNum, setPageNum] = useState(0);

  return (
    <>
      <ExtensionContextProvider>
        <Message></Message>
        <Title></Title>
        <div className="app">
          <div className="app-grid">
            <ColsSelector></ColsSelector>
            <Grid pageNum={pageNum} onPageChange={setPageNum}></Grid>
            <Pagination pageNum={pageNum} onChange={setPageNum} />
          </div>
          <GridEditor></GridEditor>
        </div>
      </ExtensionContextProvider>
    </>
  );
}

export default App;
