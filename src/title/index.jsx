import "./title.css";
import React from "react";
import { useExtension } from "../extension-context";

export default function Title() {
  const {
    params: { title },
  } = useExtension();

  return title != null && <div class="title">{title}</div>;
}
