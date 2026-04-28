import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api';

function NoteEditor() {
  const { id } = useParams();
  const isEditing = id !== 'new';
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isEditing) {
      fetch(`${API_BASE}/notes/${id}`)
        .then(res => res.json())
        .then(res => {
          if (res.code === 200) {
            setTitle(res.data.title);
            setContent(res.data.content);
          }
        });
    }
  }, [id, isEditing]);

  const handleSubmit = async () => {
    setLoading(true);
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${API_BASE}/admin/notes/${id}` : `${API_BASE}/admin/notes`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, content })
    });
    const data = await res.json();
    setLoading(false);
    if (data.code === 200) {
      navigate(`/study-notes/${data.data.id}`);
    } else {
      alert('Error: ' + (data.msg || 'Unknown error'));
    }
  };

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <h2 className="title is-4">{isEditing ? 'Edit Note' : 'New Note'}</h2>
        <input
          className="input mb-3"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          className="textarea mb-3"
          placeholder="Write your Markdown here..."
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={20}
        />
        <button className="button is-dark" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </section>
  );
}

export default NoteEditor;