// src/components/RightWidgets.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function RightWidgets() {
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    // Dynamically import all the photos
    const modules = import.meta.glob('../assets/PHOTOGRAPHY/*.{jpg,JPG,jpeg,JPEG,png,PNG}');
    const loaded = Object.keys(modules).map(async (path) => {
      const mod = await modules[path]();
      return { src: mod.default, alt: path.split('/').pop().split('.')[0], path };
    });
    Promise.all(loaded).then((allImages) => {
      // In descending order by filename (newest first), then take the top 4
      const sorted = allImages.sort((a, b) => b.path.localeCompare(a.path));
      setPhotos(sorted.slice(0, 4).map((img, index) => ({
        id: index + 1,
        src: img.src,
        alt: img.alt,
      })));
    });

    const noteModules = import.meta.glob('../assets/notes/*.md', { query: '?raw', import: 'default' });
    const notePaths = Object.keys(noteModules);

    const sortedPaths = notePaths.sort((a, b) => b.localeCompare(a)).slice(0, 3);
    const loadedNotes = sortedPaths.map(path => {
      const fileName = path.split('/').pop().replace('.md', '');
      return {
        id: fileName,
        title: fileName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      };
    });
    setNotes(loadedNotes);
  }, []);

  const projects = [
    { id: 1, name: 'LexiMind', desc: 'AI-Powered TOEFL English Learning Web App', link: 'https://github.com/Littlebanbrick/LexiMind' },
    { id: 2, name: 'Diaries', desc: 'A simple local diary-repository web application based on html,css,javascript,flask,SQL and python', link: 'https://github.com/Littlebanbrick/diaries' },
  ];

  return (
    <>
      {/* Photography Block */}
        <Link to="/photography" style={{ color: 'inherit', textDecoration: 'none' }}>
          <div className="card widget">
            <div className="card-content">
              <h3 className="menu-label mb-2">
                <i className="fas fa-camera mr-2"></i>Photography
              </h3>
              <div className="columns is-multiline is-mobile">
                {photos.map((photo) => (
                  <div className="column is-6" key={photo.id}>
                    <figure className="image is-square">
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        style={{
                          borderRadius: '4px',
                          objectFit: 'cover',
                          width: '100%',
                          height: '100%'
                        }}
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
              <i className="fas fa-book mr-2"></i>Study Notes
            </Link>
          </h3>
          <ul className="menu-list">
            {notes.map((note) => (
              <li key={note.id}>
                <Link to={`/study-notes/${note.id}`} className="level is-mobile">
                  <span
                    className="level-left"
                    style={{ flex: 1, wordBreak: 'break-word', marginRight: '0.6rem' }}
                  >
                    {note.title}
                  </span>
                  <span className="level-right is-size-7 has-text-grey-light">Note</span>
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
          {projects.map((proj) => (
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
    </>
  );
}

export default RightWidgets;