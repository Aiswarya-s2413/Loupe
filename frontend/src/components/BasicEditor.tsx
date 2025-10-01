import React, { useState } from 'react';
import type { Value } from 'platejs';
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
} from '@platejs/basic-nodes/react';
import { Plate, PlateContent, usePlateEditor } from 'platejs/react';

const initialValue: Value = [
  {
    type: 'p',
    children: [{ text: 'Start typing your content here...' }],
  },
];

const BasicEditor: React.FC = () => {
  const [activeHeading, setActiveHeading] = useState<string | null>(null);

  const editor = usePlateEditor({
    plugins: [
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      StrikethroughPlugin,
      H1Plugin,
      H2Plugin,
      H3Plugin,
    ],
    value: initialValue,
  });

  const toggleHeading = (type: string) => {
    const { selection } = editor;
    if (!selection) return;

    // Check if current block is already this heading type
    const isActive = activeHeading === type;
    
    if (isActive) {
      // Toggle off - set back to paragraph
      editor.tf.setNodes(
        { type: 'p' },
        { at: selection }
      );
      setActiveHeading(null);
    } else {
      // Toggle on - set to heading
      editor.tf.setNodes(
        { type },
        { at: selection }
      );
      setActiveHeading(type);
    }
  };

  return (
    <div style={{ padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      {/* Toolbar */}
      <div style={{ marginBottom: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {/* Text formatting */}
        <button
          onMouseDown={(e: React.MouseEvent) => {
            e.preventDefault();
            editor.tf.toggleMark('bold');
          }}
          style={{
            padding: '6px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: '#fff',
            cursor: 'pointer'
          }}
        >
          <strong>B</strong>
        </button>
        <button
          onMouseDown={(e: React.MouseEvent) => {
            e.preventDefault();
            editor.tf.toggleMark('italic');
          }}
          style={{
            padding: '6px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: '#fff',
            cursor: 'pointer'
          }}
        >
          <em>I</em>
        </button>
        <button
          onMouseDown={(e: React.MouseEvent) => {
            e.preventDefault();
            editor.tf.toggleMark('underline');
          }}
          style={{
            padding: '6px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: '#fff',
            cursor: 'pointer'
          }}
        >
          <u>U</u>
        </button>
        <button
          onMouseDown={(e: React.MouseEvent) => {
            e.preventDefault();
            editor.tf.toggleMark('strikethrough');
          }}
          style={{
            padding: '6px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: '#fff',
            cursor: 'pointer'
          }}
        >
          <s>S</s>
        </button>

        {/* Headings */}
        <button
          onMouseDown={(e: React.MouseEvent) => {
            e.preventDefault();
            toggleHeading('h1');
          }}
          style={{
            padding: '6px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: activeHeading === 'h1' ? '#e0e0e0' : '#fff',
            cursor: 'pointer'
          }}
        >
          H1
        </button>
        <button
          onMouseDown={(e: React.MouseEvent) => {
            e.preventDefault();
            toggleHeading('h2');
          }}
          style={{
            padding: '6px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: activeHeading === 'h2' ? '#e0e0e0' : '#fff',
            cursor: 'pointer'
          }}
        >
          H2
        </button>
        <button
          onMouseDown={(e: React.MouseEvent) => {
            e.preventDefault();
            toggleHeading('h3');
          }}
          style={{
            padding: '6px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: activeHeading === 'h3' ? '#e0e0e0' : '#fff',
            cursor: 'pointer'
          }}
        >
          H3
        </button>
      </div>

      {/* Editor */}
      <Plate editor={editor}>
        <PlateContent
          style={{ padding: '16px', minHeight: '200px', border: '1px solid #eee', borderRadius: '4px' }}
          placeholder="Start typing your content here..."
        />
      </Plate>
    </div>
  );
};

export default BasicEditor;