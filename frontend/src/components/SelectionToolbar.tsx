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
        onMouseDown={(e) => { e.preventDefault(); onAsk(); }}
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid #ccc",
          background: "#111",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Ask AI
      </button>
    </div>
  );
}
