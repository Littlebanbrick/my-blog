import { useState, useEffect } from 'react';
import { getCurrentUser } from '../utils';

const API_BASE = 'http://localhost:8000/api';
const ADMIN_API = 'http://localhost:8000/api/admin/photos';

function PhotographyPage() {
  const [photos, setPhotos] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/photos`)
      .then(res => res.json())
      .then(res => setPhotos(res.data || []))
      .catch(console.error);

    getCurrentUser().then(res => {
      if (res.data?.role === 'admin') setIsAdmin(true);
    });
  }, []);

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        await fetch(`${ADMIN_API}/upload`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
      } catch (err) {
        console.error('Upload failed', err);
      }
    }
    setUploading(false);

    fetch(`${API_BASE}/photos`)
      .then(res => res.json())
      .then(res => setPhotos(res.data || []));
  };

  const handleDelete = async (filename) => {
    if (!window.confirm('Delete this photo?')) return;
    await fetch(`${ADMIN_API}/${filename}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    setPhotos(prev => prev.filter(p => !p.endsWith(filename)));
  };

  return (
    <>
      <section className="section has-navbar-fixed-top">
        <div className="container">
          <div className="level">
            <div className="level-left">
              <h1 className="title is-3">Photography</h1>
            </div>
            <div className="level-right">
              {isAdmin && (
                <div className="file is-light">
                  <label className="file-label">
                    <input
                      className="file-input"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={uploading}
                    />
                    <span className="file-cta">
                      <span className="file-icon"><i className="fas fa-upload"></i></span>
                      <span className="file-label">{uploading ? 'Uploading…' : 'Upload Photos'}</span>
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="columns is-multiline">
            {photos.map((src, idx) => {
              const filename = src.split('/').pop();
              return (
                <div key={src} className="column is-6-tablet is-4-desktop is-3-widescreen">
                  <div className="card" style={{ cursor: 'pointer' }}>
                    <div className="card-image">
                      <figure className="image is-4by3">
                        <img
                          src={src}
                          alt={`photo-${idx}`}
                          style={{ objectFit: 'cover' }}
                          onClick={() => setSelectedImage(src)}
                        />
                      </figure>
                    </div>
                    {isAdmin && (
                      <footer className="card-footer">
                        <a
                          className="card-footer-item has-text-danger"
                          onClick={(e) => { e.stopPropagation(); handleDelete(filename); }}
                        >
                          Delete
                        </a>
                      </footer>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {selectedImage && (
        <div
          className="modal is-active"
          onClick={() => setSelectedImage(null)}
          style={{ alignItems: 'center', justifyContent: 'center' }}
        >
          <div className="modal-background" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}></div>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: 'auto', maxWidth: '95vw', maxHeight: '95vh', margin: '0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img
              src={selectedImage}
              alt="preview"
              style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', borderRadius: '4px' }}
            />
          </div>
          <button className="modal-close is-large" onClick={() => setSelectedImage(null)} style={{ position: 'fixed', top: '1rem', right: '1rem', backgroundColor: 'rgba(0,0,0,0.6)' }} />
        </div>
      )}
    </>
  );
}

export default PhotographyPage;