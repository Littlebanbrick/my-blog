import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api';

function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const res = await fetch(`${API_BASE}/admin/posts/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, preview: content, location: "" })
    });
    const data = await res.json();
    if (data.code === 200) {
      alert('Post created!');
      navigate('/');
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
                <input className="input mb-3" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
                <textarea className="textarea mb-3" placeholder="Content" value={content} onChange={e=>setContent(e.target.value)} />
                <button className="button is-primary is-fullwidth" onClick={handleSubmit}>Publish</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CreatePostPage;