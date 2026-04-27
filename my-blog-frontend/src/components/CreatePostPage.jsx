import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api';

function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/posts/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, preview: content, location: location.trim() })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        const msg = errData?.detail?.[0]?.msg || errData?.msg || `HTTP ${res.status}`;
        alert('Failed to create post: ' + msg);
        return;
      }

      const data = await res.json();
      if (data.code === 200) {
        alert('Post created!');
        navigate('/');
      } else {
        alert('Failed: ' + (data.msg || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-6">
            <div className="card">
              <div className="card-content">
                <h2 className="title is-4">Create New Post</h2>
                <input
                  className="input mb-3"
                  placeholder="Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
                <textarea
                  className="textarea mb-3"
                  placeholder="Content"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={8}
                />
                <input
                  className="input mb-3"
                  placeholder="Location (optional)"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
                <button className="button is-dark is-fullwidth" onClick={handleSubmit}>
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CreatePostPage;