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
import { useParams, useNavigate } from 'react-router-dom';

const EMPTY_DOC: Value = [
  { type: 'p', children: [{ text: '' }] }
];

const SharedPageViewer: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [initialValue, setInitialValue] = useState<Value>(EMPTY_DOC);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState<string>('Shared Page');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    document.body.dataset.theme = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  // Custom Comment Component for read-only view
  const CommentElement = ({ attributes, children, element }: any) => (
    <div
      {...attributes}
      contentEditable={false}
      className={`ai-comment ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      <div className="ai-comment__header">🤖 AI Comment</div>
      <div className="ai-comment__body">
        {element.children.map((child: any) => child.text)}
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

  // Fetch shared page from backend
  useEffect(() => {
    if (!token) {
      setError('Invalid share link');
      setIsLoading(false);
      return;
    }

    fetch(`http://localhost:8000/public/${token}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Page not found or no longer shared');
        }
        return res.json();
      })
      .then(data => {
        setInitialValue(data.content);
        setPageTitle(data.title || 'Shared Page');
        editor.tf.setValue(data.content);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load shared page');
      })
      .finally(() => setIsLoading(false));
  }, [token, editor]);

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="page-shell__header">
          <div className="page-shell__logo" aria-hidden>🔍</div>
          <div className="page-shell__meta">
            <span className="page-shell__title">Loupe Research OS</span>
            <span className="page-shell__subtitle">Loading shared page…</span>
          </div>
        </div>
        <div className="page-shell__surface page-shell__surface--centered">
          <div className="loader">
            <div className="loader__spinner" />
            <p className="loader__label">Loading content</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="page-shell__header">
          <div className="page-shell__logo" aria-hidden>🔍</div>
          <div className="page-shell__meta">
            <span className="page-shell__title">Loupe Research OS</span>
          </div>
        </div>
        <div className="page-shell__surface page-shell__surface--centered">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⚠️ {error}</h2>
            <p style={{ marginBottom: '1.5rem', opacity: 0.7 }}>
              This page may have been removed or is no longer publicly accessible.
            </p>
            <button
              type="button"
              className="action-button"
              onClick={() => navigate('/')}
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="page-shell__header">
        <div className="page-shell__meta">
          <div className="page-shell__titlebar">
            <div className="page-shell__logo" aria-hidden>🔍</div>
            <div>
              <h1 className="page-shell__title">{pageTitle}</h1>
              <p className="page-shell__subtitle">📖 Read-only shared view</p>
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
              className="action-button"
              onClick={() => navigate('/')}
            >
              Create Your Own
            </button>
          </div>
        </div>
      </header>

      <main className="page-shell__surface">
        <section className="editor-panel" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="editor-surface" style={{ pointerEvents: 'none', userSelect: 'text' }}>
            <Plate editor={editor}>
              <PlateContent className="editor" readOnly />
            </Plate>
          </div>

          <footer className="editor-footer">
            <div className="editor-footer__status" role="status">
              🔒 This is a read-only view
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
};

export default SharedPageViewer;