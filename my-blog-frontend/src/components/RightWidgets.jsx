import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authFetch, getImageUrl } from '../utils';
import Lightbox from './LightBox';

function RightWidgets() {
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/photos')
      .then(res => res.json())
      .then(res => {
        const all = res.data || [];
        setPhotos(all.slice(0, 4));
        setLoading(false);
      });

    authFetch('/api/notes')
      .then(res => res.json())
      .then(res => {
        const latest = (res.data || []);
        setNotes(latest.map(n => ({ id: n.id, title: n.title })));
        setLoading(false);
      });

    authFetch('/api/projects')
      .then(res => res.json())
      .then(res => {
        setProjects(res.data || [])
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) {
    return <div className="card"><div className="card-content">Loading moments...</div></div>
  }

  return (
    <>
    <div className={loading ? '' : 'moment-slide-up'}>
      <Link to="/photography" style={{ color: 'inherit', textDecoration: 'none' }}>
        <div className="card widget">
          <div className="card-content">
            <h3 className="menu-label mb-2">
              <i className="fas fa-camera mr-2"></i>Photography
            </h3>
            <div className="columns is-multiline is-mobile">
              {photos.map((src, idx) => (
                <div className="column is-6" key={idx}>
                  <figure className="image is-square">
                    <img
                      src={getImageUrl(src)}
                      alt={`photo-${idx}`}
                      style={{ objectFit: 'cover' }}
                      onClick={() => openLightbox(idx)}
                    />
                  </figure>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Link>

      {/* Study Notes Block */}
      <div className="card widget">
        <div className="card-content">
          <h3 className="menu-label mb-2">
            <Link to="/study-notes" style={{ color: 'inherit', textDecoration: 'none' }}>
              <i className="fas fa-book mr-2 mb-2"></i>Study Notes
            </Link>
          </h3>
          <ul className="menu-list">
            {notes.map((note) => (
              <li key={note.id}>
                <Link to={`/study-notes/${note.id}`} className="level is-mobile">
                  <span
                    className="level-left mb-2"
                    style={{ flex: 1, wordBreak: 'break-word', marginRight: '0.6rem' }}
                  >
                    {note.title}
                  </span>
                  <span className="level-right is-size-7 has-text-grey-light mb-2">Note</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Projects Block */}
      <div className="card widget">
        <div className="card-content">
          <h3 className="menu-label mb-4">
            <Link to="/projects" style={{ color: 'inherit', textDecoration: 'none' }}>
              <i className="fas fa-code-branch mr-2"></i>Projects
            </Link>
          </h3>
          {projects.map(proj => (
            <article className="media" key={proj.id}>
              <div className="media-content">
                <p className="title is-6 mb-1">
                  <a href={proj.link} target="_blank" rel="noopener noreferrer">{proj.name}</a>
                </p>
                <p className="subtitle is-7 has-text-grey">{proj.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}

export default RightWidgets;