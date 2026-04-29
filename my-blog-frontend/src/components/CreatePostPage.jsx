import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api';

function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (uploading) return;
    setUploading(true);

    try {
      const imageUrls = [];
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch(`${API_BASE}/admin/upload-post-image`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => null);
          throw new Error(err?.detail || err?.msg || 'Image upload failed');
        }
        const uploadData = await uploadRes.json();
        if (uploadData.code !== 200) {
          throw new Error(uploadData.msg || 'Image upload failed');
        }
        imageUrls.push(uploadData.data.url);
      }

      const res = await fetch(`${API_BASE}/admin/posts/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          preview: content,
          location: location.trim(),
          images: imageUrls,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        const msg = errData?.detail?.[0]?.msg || errData?.msg || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const data = await res.json();
      if (data.code === 200) {
        alert('Post created!');
        navigate('/');
      } else {
        throw new Error(data.msg || 'Unknown error');
      }
    } catch (err) {
      console.error(err);
      alert('Failed: ' + err.message);
    } finally {
      setUploading(false);
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
                <div className="file is-light is-small has-name mt-3">
                  <label className="file-label">
                    <input
                      className="file-input"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const newFiles = Array.from(e.target.files);
                        setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 9));
                        e.target.value = null;
                      }}
                    />
                    <span className="file-cta">
                      <span className="file-icon"><i className="fas fa-upload"></i></span>
                      <span className="file-label">Choose images (max 9)</span>
                    </span>
                    {selectedFiles.length > 0 && (
                      <span className="file-name">
                        {selectedFiles.map(f => f.name).join(', ')}
                      </span>
                    )}
                  </label>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="tags mt-1">
                    {selectedFiles.map((file, idx) => (
                      <span className="tag is-info is-light is-small" key={idx}>
                        {file.name}
                        <button
                          className="delete is-small"
                          onClick={() => {
                            setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
                          }}
                        ></button>
                      </span>
                    ))}
                  </div>
                )}
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