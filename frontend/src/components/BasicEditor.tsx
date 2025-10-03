import React, { useState, useEffect } from 'react';
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
import SelectionToolbar from './SelectionToolbar';

const EMPTY_DOC: Value = [
  { type: 'p', children: [{ text: '' }] }
];

const BasicEditor: React.FC = () => {
  const [pageId] = useState<number>(1);
  const [initialValue, setInitialValue] = useState<Value>(EMPTY_DOC);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAsking, setIsAsking] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [activeBlock, setActiveBlock] = useState<string>('p');

  // Custom Comment Component
  const CommentElement = ({ attributes, children, element }: any) => (
    <div 
      {...attributes}
      contentEditable={false}
      style={{
        padding: '12px 16px',
        margin: '16px 0',
        fontStyle: 'italic',
        fontSize: '0.95rem',
        color: '#666',
        background: '#f8f9fa',
        borderLeft: '4px solid #2196F3',
        borderRadius: '4px',
      }}
    >
      <div style={{ 
        fontSize: '0.8rem', 
        color: '#2196F3', 
        fontWeight: '600',
        marginBottom: '8px',
        fontStyle: 'normal'
      }}>
        🤖 AI Comment
      </div>
      <div style={{ color: '#333', fontStyle: 'italic', lineHeight: '1.5' }}>
        {element.children.map((child: any, idx: number) => child.text)}
      </div>
      {children}
    </div>
  );
  
  
  

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
    override: {
      components: {
        comment: CommentElement,
      },
    },
  });

  // ===== Fetch from backend on load =====
  useEffect(() => {
    fetch(`http://localhost:8000/pages/${pageId}`)
      .then(res => {
        if (!res.ok) throw new Error('No existing page — starting fresh');
        return res.json();
      })
      .then(data => {
        setInitialValue(data.content);
        editor.tf.setValue(data.content);
      })
      .catch(() => {
        setInitialValue(EMPTY_DOC);
        editor.tf.setValue(EMPTY_DOC);
      })
      .finally(() => setIsLoading(false));
  }, [pageId, editor]);

  // ===== Save to backend =====
  const handleSave = async () => {
    const currentValue = editor.children;
    setIsSaving(true);

    try {
      const response = await fetch('http://localhost:8000/pages/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'My Page', content: currentValue }),
      });

      const data = await response.json();
      console.log('Saved as page:', data.id);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleHeading = (type: string) => {
    const { selection } = editor;
    if (!selection) return;

    const isActive = activeHeading === type;

    editor.tf.setNodes({ type: isActive ? 'p' : type }, { at: selection });
    setActiveHeading(isActive ? null : type);
    setActiveBlock(isActive ? 'p' : type);
  };

  const toggleBlockType = (type: string) => {
    const { selection } = editor;
    if (!selection) return;
    
    const isActive = activeBlock === type;
    editor.tf.setNodes({ type: isActive ? 'p' : type }, { at: selection });
    setActiveBlock(isActive ? 'p' : type);
  };

  const insertList = (listType: 'ul' | 'ol') => {
    const { selection } = editor;
    if (!selection) return;
    
    const listItem = {
      type: 'li',
      children: [{ text: '' }]
    };
    
    const list = {
      type: listType,
      children: [listItem]
    };
    
    editor.tf.insertNode(list);
  };

  const applyTextColor = (color: string) => {
    editor.tf.addMark('color', color);
    setShowColorPicker(false);
  };

  const applyBgColor = (color: string) => {
    editor.tf.addMark('backgroundColor', color);
    setShowBgColorPicker(false);
  };

  const applyFontSize = (size: string) => {
    editor.tf.addMark('fontSize', size);
    setShowFontSize(false);
  };

  const clearFormatting = () => {
    const { selection } = editor;
    if (!selection) return;

    const marksToRemove: string[] = [
      'bold', 
      'italic', 
      'underline', 
      'strikethrough', 
      'color', 
      'backgroundColor', 
      'fontSize'
    ];

    marksToRemove.forEach(mark => {
      editor.tf.removeMark(mark);
    });
    
    editor.tf.setNodes({ type: 'p' }, { at: selection });
    setActiveHeading(null);
    setActiveBlock('p');
  };

  const insertHorizontalRule = () => {
    editor.tf.insertNode({
      type: 'hr',
      children: [{ text: '' }]
    });
  };

  const insertBlockquote = () => {
    toggleBlockType('blockquote');
  };

  const insertCodeBlock = () => {
    toggleBlockType('code');
  };

  const indentText = () => {
    const { selection } = editor;
    if (!selection) return;
    
    editor.tf.setNodes({
      indent: 1
    }, { at: selection });
  };

  const outdentText = () => {
    const { selection } = editor;
    if (!selection) return;
    
    editor.tf.setNodes({
      indent: 0
    }, { at: selection });
  };

  // ===== Insert AI Comment =====
  const insertAIComment = (aiText: string) => {
    const { selection } = editor;
  
    const comment = {
      type: 'comment',
      author: 'AI',
      children: [{ text: aiText }], 
    };
  
    if (!selection) {
      editor.tf.insertNodes(comment, { at: [editor.children.length] });
    } else {
      try {
        editor.tf.insertNodes(comment, { at: [selection.anchor.path[0] + 1] });
      } catch {
        editor.tf.insertNodes(comment, { at: [editor.children.length] });
      }
    }
  };
  

  // ===== Ask AI (Fact Check) =====
  const askAIForSelection = async () => {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : '';

    if (!selectedText) return alert('Select some text first!');

    setIsAsking(true);

    try {
      const res = await fetch('http://localhost:8000/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText }),
      });

      const data = await res.json();

      insertAIComment(data.explanation || 'No response');

      setComments(prev => [
        ...prev,
        { id: Date.now(), text: selectedText, response: data.explanation || 'No response' }
      ]);

      console.log('AI Response:', data.explanation);

    } catch (err) {
      console.error(err);
      alert('AI request failed');
    } finally {
      setIsAsking(false);
    }
  };

  if (isLoading) return <p>Loading...</p>;

  const colors = [
    '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
    '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
    '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC'
  ];

  const fontSizes = ['8px', '10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];

  const buttonStyle = {
    padding: '6px 10px',
    border: '1px solid #ddd',
    background: '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  };

  const activeButtonStyle = {
    ...buttonStyle,
    background: '#e3f2fd',
    borderColor: '#2196F3',
  };

  return (
    <div style={{ padding: '2rem', border: '1px solid #ccc', borderRadius: '8px', position: 'relative', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Main Toolbar */}
      <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8f9fa', padding: '12px', borderRadius: '6px' }}>
        
        {/* Row 1: Text Formatting */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            onMouseDown={e => { e.preventDefault(); editor.tf.toggleMark('bold'); }} 
            style={buttonStyle}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button 
            onMouseDown={e => { e.preventDefault(); editor.tf.toggleMark('italic'); }} 
            style={buttonStyle}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button 
            onMouseDown={e => { e.preventDefault(); editor.tf.toggleMark('underline'); }} 
            style={buttonStyle}
            title="Underline (Ctrl+U)"
          >
            <u>U</u>
          </button>
          <button 
            onMouseDown={e => { e.preventDefault(); editor.tf.toggleMark('strikethrough'); }} 
            style={buttonStyle}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
          
          <div style={{ width: '1px', height: '24px', background: '#ddd', margin: '0 4px' }}></div>
          
          {/* Font Size Picker */}
          <div style={{ position: 'relative' }}>
            <button 
              onMouseDown={e => { e.preventDefault(); setShowFontSize(!showFontSize); setShowColorPicker(false); setShowBgColorPicker(false); }} 
              style={buttonStyle}
              title="Font Size"
            >
              A<span style={{ fontSize: '10px' }}>▼</span>
            </button>
            {showFontSize && (
              <div style={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                zIndex: 1000, 
                background: 'white', 
                border: '1px solid #ccc', 
                borderRadius: '4px',
                padding: '8px',
                marginTop: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                minWidth: '80px'
              }}>
                {fontSizes.map(size => (
                  <button 
                    key={size}
                    onMouseDown={e => { e.preventDefault(); applyFontSize(size); }} 
                    style={{ 
                      display: 'block',
                      width: '100%',
                      padding: '6px 12px',
                      border: 'none',
                      background: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: size
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Text Color Picker */}
          <div style={{ position: 'relative' }}>
            <button 
              onMouseDown={e => { e.preventDefault(); setShowColorPicker(!showColorPicker); setShowBgColorPicker(false); setShowFontSize(false); }} 
              style={buttonStyle}
              title="Text Color"
            >
              <span style={{ borderBottom: '3px solid #000' }}>A</span>
            </button>
            {showColorPicker && (
              <div style={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                zIndex: 1000, 
                background: 'white', 
                border: '1px solid #ccc', 
                borderRadius: '4px',
                padding: '12px',
                marginTop: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '6px', maxWidth: '300px' }}>
                  {colors.map(color => (
                    <button 
                      key={color}
                      onMouseDown={e => { e.preventDefault(); applyTextColor(color); }} 
                      style={{ 
                        width: '24px', 
                        height: '24px', 
                        background: color, 
                        border: '1px solid #999',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      title={color}
                    ></button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Background Color Picker */}
          <div style={{ position: 'relative' }}>
            <button 
              onMouseDown={e => { e.preventDefault(); setShowBgColorPicker(!showBgColorPicker); setShowColorPicker(false); setShowFontSize(false); }} 
              style={buttonStyle}
              title="Highlight Color"
            >
              🎨
            </button>
            {showBgColorPicker && (
              <div style={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                zIndex: 1000, 
                background: 'white', 
                border: '1px solid #ccc', 
                borderRadius: '4px',
                padding: '12px',
                marginTop: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '6px', maxWidth: '300px' }}>
                  {colors.map(color => (
                    <button 
                      key={color}
                      onMouseDown={e => { e.preventDefault(); applyBgColor(color); }} 
                      style={{ 
                        width: '24px', 
                        height: '24px', 
                        background: color, 
                        border: '1px solid #999',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      title={color}
                    ></button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button 
            onMouseDown={e => { e.preventDefault(); clearFormatting(); }} 
            style={buttonStyle}
            title="Clear Formatting"
          >
            🗑️
          </button>
        </div>

        {/* Row 2: Headings & Styles */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#666', marginRight: '4px' }}>Styles:</span>
          <button 
            onMouseDown={e => { e.preventDefault(); toggleHeading('h1'); }} 
            style={activeHeading === 'h1' ? activeButtonStyle : buttonStyle}
            title="Heading 1"
          >
            H1
          </button>
          <button 
            onMouseDown={e => { e.preventDefault(); toggleHeading('h2'); }} 
            style={activeHeading === 'h2' ? activeButtonStyle : buttonStyle}
            title="Heading 2"
          >
            H2
          </button>
          <button 
            onMouseDown={e => { e.preventDefault(); toggleHeading('h3'); }} 
            style={activeHeading === 'h3' ? activeButtonStyle : buttonStyle}
            title="Heading 3"
          >
            H3
          </button>
          
          <div style={{ width: '1px', height: '24px', background: '#ddd', margin: '0 4px' }}></div>
          
          <button 
            onMouseDown={e => { e.preventDefault(); insertBlockquote(); }} 
            style={activeBlock === 'blockquote' ? activeButtonStyle : buttonStyle}
            title="Quote"
          >
            ❝ Quote
          </button>
          <button 
            onMouseDown={e => { e.preventDefault(); insertCodeBlock(); }} 
            style={activeBlock === 'code' ? activeButtonStyle : buttonStyle}
            title="Code Block"
          >
            {'</> Code'}
          </button>
        </div>

        {/* Row 3: Lists & Alignment */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            onMouseDown={e => { e.preventDefault(); insertList('ul'); }} 
            style={buttonStyle}
            title="Bulleted List"
          >
            • List
          </button>
          <button 
            onMouseDown={e => { e.preventDefault(); insertList('ol'); }} 
            style={buttonStyle}
            title="Numbered List"
          >
            1. List
          </button>
          
          <div style={{ width: '1px', height: '24px', background: '#ddd', margin: '0 4px' }}></div>
          
          <button 
            onMouseDown={e => { e.preventDefault(); indentText(); }} 
            style={buttonStyle}
            title="Increase Indent"
          >
            ⇥
          </button>
          <button 
            onMouseDown={e => { e.preventDefault(); outdentText(); }} 
            style={buttonStyle}
            title="Decrease Indent"
          >
            ⇤
          </button>
          
          <div style={{ width: '1px', height: '24px', background: '#ddd', margin: '0 4px' }}></div>
          
          <button 
            onMouseDown={e => { e.preventDefault(); insertHorizontalRule(); }} 
            style={buttonStyle}
            title="Horizontal Line"
          >
            ─── Line
          </button>
        </div>
      </div>

      {/* AI Selection Toolbar */}
      <SelectionToolbar onAsk={askAIForSelection} />

      {/* Editor */}
      <Plate editor={editor}>
        <PlateContent 
          style={{ 
            padding: '20px', 
            minHeight: '400px', 
            border: '1px solid #e0e0e0', 
            borderRadius: '6px',
            background: 'white',
            fontSize: '16px',
            lineHeight: '1.6'
          }}
        />
      </Plate>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        style={{
          marginTop: '1rem',
          padding: '10px 24px',
          borderRadius: '6px',
          backgroundColor: isSaving ? '#aaa' : '#007bff',
          color: 'white',
          border: 'none',
          fontSize: '15px',
          fontWeight: '500',
          cursor: isSaving ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s'
        }}
      >
        {isSaving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
};

export default BasicEditor;