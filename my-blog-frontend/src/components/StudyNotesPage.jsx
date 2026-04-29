import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser, authFetch } from '../utils';

const API_BASE = 'http://localhost:8000/api';

function StudyNotesPage() {
  const [notes, setNotes] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadNotes = () => {
    authFetch(`${API_BASE}/notes`)
      .then(res => res.json())
      .then(res => setNotes(res.data || []))
      .catch(console.error);
  };

  useEffect(() => {
    loadNotes();
    getCurrentUser().then(res => {
      if (res.data?.role === 'admin') setIsAdmin(true);
    });
  }, []);

  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    await authFetch(`${API_BASE}/admin/notes/${noteId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    loadNotes();
  };

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="level">
          <div className="level-left">
            <h1 className="title is-3">Study Notes</h1>
          </div>
          {isAdmin && (
            <div className="level-right">
              <Link to="/study-notes/new" className="button is-dark">New Note</Link>
            </div>
          )}
        </div>

        <div className="columns is-multiline">
          {notes.map(note => (
            <div key={note.id} className="column is-6-tablet is-4-desktop">
              <div className="card" style={{ height: '100%' }}>
                <div className="card-content">
                  <p className="title is-5">
                    <Link to={`/study-notes/${note.id}`}>{note.title}</Link>
                  </p>
                  <p className="has-text-grey is-size-7 mb-3">{note.summary}</p>
                  <p className="is-size-7 has-text-grey-light">{note.updated_at}</p>
                </div>
                {isAdmin && (
                  <footer className="card-footer">
                    <Link to={`/study-notes/${note.id}/edit`} className="card-footer-item">Edit</Link>
                    <a className="card-footer-item has-text-danger" onClick={() => handleDelete(note.id)}>Delete</a>
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

export default StudyNotesPage;