import React, { useEffect, useState } from "react";

type Props = {
  onAsk: () => void;
};

export default function SelectionToolbar({ onAsk }: Props) {
  const [visible, setVisible] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) { setVisible(false); return; }
      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setStyle({
          position: "absolute",
          top: rect.top - 36 + window.scrollY,
          left: rect.left + window.scrollX,
          zIndex: 9999,
        });
        setVisible(true);
      } catch {
        setVisible(false);
      }
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  if (!visible) return null;
  return (
    <div style={style}>
      <button
        onMouseDown={(event) => { event.preventDefault(); onAsk(); setVisible(false); }}
        className="selection-toolbar__button"
        type="button"
      >
        🤖 ASK AI
      </button>
    </div>
  );
}
