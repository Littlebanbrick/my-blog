import { useState, useEffect } from 'react';
import { getCurrentUser, authFetch, getImageUrl } from '../utils';
import Lightbox from './LightBox';

const API_BASE = '/api';
const ADMIN_API = '/api/admin/photos';

function PhotographyPage() {
  const [photos, setPhotos] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const prevImage = () => {
    if (photos.length === 0) return;
    setLightboxIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const nextImage = () => {
    if (photos.length === 0) return;
    setLightboxIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    authFetch(`${API_BASE}/photos`)
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
        await authFetch(`${ADMIN_API}/upload`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
      } catch (err) {
        console.error('Upload failed', err);
      }
    }
    setUploading(false);

    authFetch(`${API_BASE}/photos`)
      .then(res => res.json())
      .then(res => setPhotos(res.data || []));
  };

  const handleDelete = async (filename) => {
    if (!window.confirm('Delete this photo?')) return;
    await authFetch(`${ADMIN_API}/${filename}`, {
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
              const fullSrc = getImageUrl ? getImageUrl(src) : src;
              const filename = src.split('/').pop();
              return (
                <div key={src} className="column is-6-tablet is-4-desktop is-3-widescreen">
                  <div className="card" style={{ cursor: 'pointer' }}>
                    <div className="card-image">
                      <figure className="image is-4by3">
                        <img
                          src={fullSrc}
                          alt={`photo-${idx}`}
                          style={{ objectFit: 'cover' }}
                          onClick={() => openLightbox(idx)}
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

      {/* 新灯箱：只在 lightboxIndex 不为 null 时显示 */}
      {lightboxIndex !== null && (
        <Lightbox
          images={photos.map(p => getImageUrl ? getImageUrl(p) : p)}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </>
  );
}

export default PhotographyPage;