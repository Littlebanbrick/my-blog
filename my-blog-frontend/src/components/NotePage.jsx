import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getCurrentUser } from '../utils';

const API_BASE = 'http://localhost:8000/api';

function NotePage() {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/notes/${id}`)
      .then(res => res.json())
      .then(res => {
        if (res.code === 200) setNote(res.data);
      })
      .catch(console.error);

    getCurrentUser().then(res => {
      if (res.data?.role === 'admin') setIsAdmin(true);
    });
  }, [id]);

  if (!note) return <section className="section"><div className="container">Loading...</div></section>;

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="level">
          <div className="level-left">
            <Link to="/study-notes" className="button is-light is-small">&larr; Back</Link>
          </div>
          {isAdmin && (
            <div className="level-right">
              <Link to={`/study-notes/${id}/edit`} className="button is-dark is-small">Edit</Link>
            </div>
          )}
        </div>
        <div className="content markdown-body" style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '6px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
        </div>
      </div>
    </section>
  );
}

export default NotePage;