import React from "react";

export default function Citation({ documentId, snippet, filename, onOpen }) {
  return (
    <button
      className="citation"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(documentId, snippet);
      }}
      title="Click to jump to exact highlighted document source snippet"
    >
      {filename ? filename : `doc #${documentId}`}
    </button>
  );
}
