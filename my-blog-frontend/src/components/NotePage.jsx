import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function NotePage() {
  const { id } = useParams();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNote = async () => {
      try {
        // 使用动态导入，Vite 会处理路径
        const raw = await import(`../assets/notes/${id}.md?raw`);
        setContent(raw.default);
      } catch (err) {
        console.error('Failed to load note:', err);
        setContent('# Note not found');
      } finally {
        setLoading(false);
      }
    };
    loadNote();
  }, [id]);

  if (loading) return <section className="section"><div className="container">Loading...</div></section>;

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <Link to="/study-notes" className="button is-light is-small mb-4">
          &larr; Back to Notes
        </Link>
        <div 
          className="content markdown-body" 
          style={{ 
            maxWidth: '800px', 
            margin: '0 auto',
            backgroundColor: 'transparent',
            padding: '2rem 2.5rem',
            borderRadius: '6px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </section>
  );
}

export default NotePage;