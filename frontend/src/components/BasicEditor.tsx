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
import { Plate, PlateContent, usePlateEditor, createPlatePlugin } from 'platejs/react';
import { DndPlugin } from '@udecode/plate-dnd';
import { NodeIdPlugin } from '@udecode/plate-node-id';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SelectionToolbar from './SelectionToolbar';
import Toast from './Toast';

const EMPTY_DOC: Value = [
  { type: 'p', children: [{ text: '' }] }
];

const BasicEditor: React.FC = () => {
  const [pageId, setPageId] = useState<number>(0);
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
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [title, setTitle] = useState<string>("Untitled page");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [pages, setPages] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const themeClass = isDarkMode ? 'theme-dark' : 'theme-light';

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    document.body.dataset.theme = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  const primaryActionLabel = isSaving ? 'Saving…' : 'Save';

  // Custom Comment Component – styled to match theme tokens
  const CommentElement = ({ attributes, children, element }: any) => (
    <div
      {...attributes}
      contentEditable={false}
      className={`ai-comment ${themeClass}`}
    >
      <div className="ai-comment__header">🤖 AI Comment</div>
      <div className="ai-comment__body">
        <i>{element.children.map((child: any) => child.text)}</i>
      </div>
      {children}
    </div>
  );

  const CommentPlugin = createPlatePlugin({
    key: 'comment',
    node: {
      isElement: true,
      isVoid: true,
      component: CommentElement,
    },
  });

  const editor = usePlateEditor({
    plugins: [
      NodeIdPlugin,
      DndPlugin,
      CommentPlugin,
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

  const formatToggle = (mark: string) => ({
    onMouseDown: (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      editor.tf.toggleMark(mark);
    },
  });

  // ===== Fetch pages list =====
  const fetchPages = () => {
    fetch('http://localhost:8000/pages/')
      .then(res => res.json())
      .then(data => setPages(data))
      .catch(err => console.error('Failed to load pages:', err));
  };

  useEffect(() => {
    fetchPages();
  }, []);

  // ===== Fetch from backend on load =====
  useEffect(() => {
    if (pageId && pageId !== 0) {
      fetch(`http://localhost:8000/pages/${pageId}`)
        .then(res => {
          if (!res.ok) throw new Error('No existing page — starting fresh');
          return res.json();
        })
        .then(data => {
          setTitle(data.title || 'Untitled page');
          editor.tf.setValue(data.content);
        })
        .catch(() => {
          setTitle('Untitled page');
          editor.tf.setValue(EMPTY_DOC);
        })
        .finally(() => setIsLoading(false));
    } else if (pageId === 0) {
      setTitle('Untitled page');
      editor.tf.setValue(EMPTY_DOC);
      setIsLoading(false);
    }
  }, [pageId, editor]);

  // ===== Focus editor after loading =====
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        editor.tf.select({ anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 0 } });
        editor.tf.focus();
      }, 100);
    }
  }, [isLoading, editor]);

  // ===== Save to backend =====
  const handleSave = async () => {
    const currentValue = editor.children;
    setIsSaving(true);

    try {
      const isUpdate = pageId > 0;
      const url = isUpdate ? `http://localhost:8000/pages/${pageId}` : 'http://localhost:8000/pages/';
      const method = isUpdate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: currentValue }),
      });

      const data = await response.json();
      if (!isUpdate) {
        console.log('Saved as new page:', data.id);
        setPageId(data.id);
        setToast({ message: 'Saved successfully!', type: 'success' });
      } else {
        console.log('Updated page:', data.id);
        setToast({ message: 'Page saved successfully!', type: 'success' });
      }
      fetchPages();
    } catch (error) {
      console.error('Save failed:', error);
      setToast({ message: 'Failed to save page. Please try again.', type: 'error' });
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
  

  // ===== Share Page =====
  const handleSharePage = async () => {
    setIsSharing(true);
    try {
      const response = await fetch(`http://localhost:8000/pages/${pageId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }

      const data = await response.json();
      setShareUrl(data.share_url);
      setShowShareModal(true);
    } catch (error) {
      console.error('Share failed:', error);
      alert('Failed to generate share link. Please save the page first.');
    } finally {
      setIsSharing(false);
    }
  };

  const copyShareLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
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

  // ===== Delete Page =====
  const handleDeletePage = async () => {
    if (!pageToDelete) return;

    try {
      const response = await fetch(`http://localhost:8000/pages/${pageToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete page');
      }

      // If the deleted page was the current one, switch to new page
      if (pageToDelete === pageId) {
        setPageId(0);
        setTitle('Untitled page');
        editor.tf.setValue(EMPTY_DOC);
        setIsLoading(false);
        setTimeout(() => editor.tf.focus(), 100);
      }

      // Refresh pages list
      fetchPages();
      setShowDeleteModal(false);
      setPageToDelete(null);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete page');
    }
  };

  const openDeleteModal = (pageId: number) => {
    setPageToDelete(pageId);
    setShowDeleteModal(true);
  };

  if (isLoading) {
    return (
      <DndProvider backend={HTML5Backend}>
        <div className="page-shell">
        <div className="page-shell__header">
          <div className="page-shell__logo" aria-hidden>🔍</div>
          <div className="page-shell__meta">
            <span className="page-shell__title">Loupe Research OS</span>
            <span className="page-shell__subtitle">Loading workspace…</span>
          </div>
        </div>
        <div className="page-shell__surface page-shell__surface--centered">
          <div className="loader">
            <div className="loader__spinner" />
            <p className="loader__label">Preparing your canvas</p>
          </div>
        </div>
      </div>
    </DndProvider>
    );
  }

  const colors = [
    '#111827', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6', '#ffffff',
    '#f97316', '#f59e0b', '#fde047', '#22c55e', '#06b6d4', '#0ea5e9', '#2563eb', '#7c3aed', '#db2777', '#ef4444',
    '#fbcfe8', '#f5d0fe', '#ddd6fe', '#bfdbfe', '#93c5fd', '#60a5fa', '#bae6fd', '#bbf7d0', '#fde68a', '#fed7aa', '#fecaca',
  ];

  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '42px', '48px'];

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="page-shell">
      <header className="page-shell__header">
        <div className="page-shell__meta">
          <div className="page-shell__titlebar">
            <div className="page-shell__logo" aria-hidden>🔍</div>
            <div>
              <h1 className="page-shell__title">Loupe</h1>
              <p className="page-shell__subtitle">Think, write, and synthesize faster with AI</p>
            </div>
          </div>
          <div className="page-shell__actions">
            <button
              type="button"
              className="action-button action-button--muted"
              onClick={() => setIsDarkMode((value) => !value)}
              aria-label="Toggle theme"
            >
              {isDarkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button
              type="button"
              className="action-button action-button--muted"
              onClick={handleSharePage}
              disabled={isSharing}
            >
              {isSharing ? '🔗 Sharing…' : '🔗 Share'}
            </button>
            <button
              type="button"
              className="action-button"
              onClick={handleSave}
              disabled={isSaving}
            >
              {primaryActionLabel}
            </button>
          </div>
        </div>
      </header>

      <main className="page-shell__surface">
        <aside className="sidebar">
          <div className="sidebar__section">
            <span className="sidebar__label">Workspace</span>
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingTitle(false);
                }}
                className="sidebar__item sidebar__item--active sidebar__input"
                autoFocus
              />
            ) : (
              <button
                type="button"
                className="sidebar__item sidebar__item--active"
                onClick={() => setIsEditingTitle(true)}
              >
                📄 {title}
              </button>
            )}
          </div>
          <div className="sidebar__section">
            <span className="sidebar__label">Pages</span>
            <button
              type="button"
              className="sidebar__item"
              onClick={() => {
                setPageId(0); // dummy id for new
                setTitle('Untitled page');
                editor.tf.setValue(EMPTY_DOC);
                setIsLoading(false);
                // Focus editor
                setTimeout(() => editor.tf.focus(), 100);
              }}
            >
              ➕ New Page
            </button>
            {pages.map(page => (
              <div key={page.id} className="sidebar__item-container">
                <button
                  type="button"
                  className={`sidebar__item ${page.id === pageId ? 'sidebar__item--active' : ''}`}
                  onClick={() => {
                    setPageId(page.id);
                    setIsLoading(true); // to show loading while fetching
                  }}
                >
                  📄 {page.title || 'Untitled'}
                </button>
                <button
                  type="button"
                  className="sidebar__delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteModal(page.id);
                  }}
                  title="Delete page"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
          <div className="sidebar__section sidebar__section--footer">
            <span className="sidebar__hint">All changes are saved to your workspace</span>
          </div>
        </aside>

        <section className="editor-panel">
          <div className="editor-panel__toolbar">
            <div className="toolbar__row">
              <button
                {...formatToggle('bold')}
                className="toolbar__button"
                title="Bold (Ctrl+B)"
              >
                <strong>B</strong>
              </button>
              <button
                {...formatToggle('italic')}
                className="toolbar__button"
                title="Italic (Ctrl+I)"
              >
                <em>I</em>
              </button>
              <button
                {...formatToggle('underline')}
                className="toolbar__button"
                title="Underline (Ctrl+U)"
              >
                <u>U</u>
              </button>
              <button
                {...formatToggle('strikethrough')}
                className="toolbar__button"
                title="Strikethrough"
              >
                <s>S</s>
              </button>

              <span className="toolbar__divider" aria-hidden />

              <div className="toolbar__popover">
                <button
                  type="button"
                  className="toolbar__button"
                  title="Font size"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setShowFontSize((value) => !value);
                    setShowColorPicker(false);
                    setShowBgColorPicker(false);
                  }}
                >
                  A<span className="toolbar__chevron">▼</span>
                </button>
                {showFontSize && (
                  <div className="popover">
                    {fontSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        className="popover__item"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          applyFontSize(size);
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="toolbar__popover">
                <button
                  type="button"
                  className="toolbar__button"
                  title="Text color"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setShowColorPicker((value) => !value);
                    setShowBgColorPicker(false);
                    setShowFontSize(false);
                  }}
                >
                  <span className="toolbar__text-color">A</span>
                </button>
                {showColorPicker && (
                  <div className="popover popover--palette">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="color-swatch"
                        style={{ background: color }}
                        title={color}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          applyTextColor(color);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="toolbar__popover">
                <button
                  type="button"
                  className="toolbar__button"
                  title="Highlight color"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setShowBgColorPicker((value) => !value);
                    setShowColorPicker(false);
                    setShowFontSize(false);
                  }}
                >
                  🎨
                </button>
                {showBgColorPicker && (
                  <div className="popover popover--palette">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="color-swatch"
                        style={{ background: color }}
                        title={color}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          applyBgColor(color);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="toolbar__button"
                title="Clear formatting"
                onMouseDown={(event) => {
                  event.preventDefault();
                  clearFormatting();
                }}
              >
                🧹
              </button>
            </div>

            <div className="toolbar__row">
              <span className="toolbar__label">Styles</span>
              <button
                type="button"
                className={`toolbar__button ${activeHeading === 'h1' ? 'toolbar__button--active' : ''}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  toggleHeading('h1');
                }}
              >
                H1
              </button>
              <button
                type="button"
                className={`toolbar__button ${activeHeading === 'h2' ? 'toolbar__button--active' : ''}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  toggleHeading('h2');
                }}
              >
                H2
              </button>
              <button
                type="button"
                className={`toolbar__button ${activeHeading === 'h3' ? 'toolbar__button--active' : ''}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  toggleHeading('h3');
                }}
              >
                H3
              </button>

              <span className="toolbar__divider" aria-hidden />

              <button
                type="button"
                className={`toolbar__button ${activeBlock === 'blockquote' ? 'toolbar__button--active' : ''}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  insertBlockquote();
                }}
              >
                ❝ Quote
              </button>
              <button
                type="button"
                className={`toolbar__button ${activeBlock === 'code' ? 'toolbar__button--active' : ''}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  insertCodeBlock();
                }}
              >
                {'</>'} Code
              </button>
            </div>

            <div className="toolbar__row">
              <button
                type="button"
                className="toolbar__button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  insertList('ul');
                }}
              >
                • List
              </button>
              <button
                type="button"
                className="toolbar__button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  insertList('ol');
                }}
              >
                1. List
              </button>

              <span className="toolbar__divider" aria-hidden />

              <button
                type="button"
                className="toolbar__button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  indentText();
                }}
              >
                ⇥
              </button>
              <button
                type="button"
                className="toolbar__button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  outdentText();
                }}
              >
                ⇤
              </button>

              <span className="toolbar__divider" aria-hidden />

              <button
                type="button"
                className="toolbar__button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  insertHorizontalRule();
                }}
              >
                ───
              </button>
            </div>
          </div>

          <SelectionToolbar onAsk={askAIForSelection} />

          <div className="editor-surface">
            <Plate editor={editor}>
              <PlateContent className="editor" />
            </Plate>
          </div>

          <footer className="editor-footer">
            <div className="editor-footer__status" role="status" aria-live="polite">
              {isAsking ? 'Fact checking selection…' : 'Ready to edit'}
            </div>
          </footer>
        </section>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowShareModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>🔗 Share Your Page</h2>
            <p style={{ marginBottom: '1.5rem', opacity: 0.7 }}>
              Anyone with this link can view your page in read-only mode.
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginBottom: '1.5rem',
              padding: '0.75rem',
              backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
              borderRadius: '8px',
              wordBreak: 'break-all',
            }}>
              <input
                type="text"
                value={shareUrl || ''}
                readOnly
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.875rem',
                  color: 'inherit',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="action-button action-button--muted"
                onClick={() => setShowShareModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="action-button"
                onClick={copyShareLink}
              >
                📋 Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>🗑️ Delete Page</h2>
            <p style={{ marginBottom: '1.5rem', opacity: 0.7 }}>
              Are you sure you want to delete this page? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="action-button action-button--muted"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="action-button action-button--danger"
                onClick={handleDeletePage}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
    </DndProvider>
  );
};

export default BasicEditor;