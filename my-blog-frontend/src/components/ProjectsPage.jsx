import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser, authFetch } from '../utils';

const API_BASE = 'http://localhost:8000/api';

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadProjects = () => {
    authFetch(`${API_BASE}/projects`)
      .then(res => res.json())
      .then(res => setProjects(res.data || []))
      .catch(console.error);
  };

  useEffect(() => {
    loadProjects();
    getCurrentUser().then(res => {
      if (res.data?.role === 'admin') setIsAdmin(true);
    });
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    await authFetch(`${API_BASE}/admin/projects/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    loadProjects();
  };

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="level">
          <div className="level-left">
            <h1 className="title is-3">Projects</h1>
          </div>
          {isAdmin && (
            <div className="level-right">
              <Link to="/projects/new" className="button is-dark">New Project</Link>
            </div>
          )}
        </div>

        <div className="columns is-multiline">
          {projects.map(proj => (
            <div key={proj.id} className="column is-6-tablet is-4-desktop">
              <div className="card" style={{ height: '100%' }}>
                <div className="card-content">
                  <p className="title is-5">
                    <a href={proj.link} target="_blank" rel="noopener noreferrer">{proj.name}</a>
                  </p>
                  <p className="has-text-grey">{proj.desc}</p>
                </div>
                {isAdmin && (
                  <footer className="card-footer">
                    <Link to={`/projects/${proj.id}/edit`} className="card-footer-item">Edit</Link>
                    <a className="card-footer-item has-text-danger" onClick={() => handleDelete(proj.id)}>Delete</a>
                  </footer>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProjectsPage;