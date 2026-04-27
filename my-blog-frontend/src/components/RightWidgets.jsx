// src/components/RightWidgets.jsx

import photo1 from '../assets/PHOTOGRAPHY/DSC_4204.JPG';
import photo2 from '../assets/PHOTOGRAPHY/DSC_4209.JPG';
import photo3 from '../assets/PHOTOGRAPHY/DSC_4210.JPG';
import photo4 from '../assets/PHOTOGRAPHY/DSC_4231.JPG';

import { Link } from 'react-router-dom'

function RightWidgets() {
  // Mock data for photos, notes, projects
  const photos = [
    { id: 1, src: photo1, alt: 'Sushi' },
    { id: 2, src: photo2, alt: 'Cups' },
    { id: 3, src: photo3, alt: 'Dried Fruits' },
    { id: 4, src: photo4, alt: 'Lobster Dolls' }
  ];

  const notes = [
    { id: 1, title: 'Basic Git Operations', date: '2026-04-20' },
    { id: 2, title: 'HTML/CSS Fundamentals', date: '2026-04-18' },
    { id: 3, title: 'Docker Basics', date: '2026-04-15' }
  ];

  const projects = [
    { id: 1, name: 'Personal Blog', desc: 'React + FastAPI', link: '#' },
    { id: 2, name: 'Weather CLI', desc: 'Python + OpenWeather', link: '#' },
    { id: 3, name: 'Todo App', desc: 'Vue + Pinia', link: '#' }
  ];

  return (
    <>
      {/* Photography Block */}
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
                        objectFit: 'cover',   // Enable cropping.
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

      {/* Study Notes Block */}
      <Link to="/photography" style={{ color: 'inherit', textDecoration: 'none' }}>
        <div className="card widget">
          <div className="card-content">
            <h3 className="menu-label mb-2">
              <i className="fas fa-book mr-2"></i>Study Notes
            </h3>
            <ul className="menu-list">
              {notes.map((note) => (
                <li key={note.id}>
                  <a href={`/notes/${note.id}`} className="level is-mobile">
                    <span
                      className="level-left"
                      style={{ flex: 1, wordBreak: 'break-word', marginRight: '0.6rem' }}>
                          {note.title}
                    </span>
                    <span
                    className="level-right is-size-7 has-text-grey-light"
                    style={{ position: 'relative', top: '1px' }}
                    >{note.date}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Link>

      {/* Projects Block */}
      <div className="card widget">
        <div className="card-content">
          <h3 className="menu-label mb-4">
            <i className="fas fa-code-branch mr-2"></i>Projects
          </h3>
          {projects.map((proj) => (
            <article className="media" key={proj.id}>
              <div className="media-content">
                <p className="title is-6 mb-1">
                  <a href={proj.link}>{proj.name}</a>
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