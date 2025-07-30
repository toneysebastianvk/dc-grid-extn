import "./message.css";
import React from "react";
import { useExtension } from "../extension-context";
import clsx from "clsx";
import { useState } from "react";

export default function Message() {
  let { message, messageId } = useExtension();

  const [showMessage, setShowMessage] = useState(false);
  const [messageTimeout, setMessageTimeout] = useState();
  const [lastMessageId, setLastMessageId] = useState(messageId);

  if (messageId !== lastMessageId)
  {
    setShowMessage(true);
    clearTimeout(messageTimeout);
    setMessageTimeout(setTimeout(() => {
        setShowMessage(false);
    }, 3000));
    setLastMessageId(messageId);
  }

  return <div className={clsx('message', {'show-message': showMessage})}>{message}</div>;
}
