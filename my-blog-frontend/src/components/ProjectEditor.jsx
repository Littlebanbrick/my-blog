import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api/admin/projects';

function ProjectEditor() {
  const { id } = useParams();
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [link, setLink] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isEditing) {
      fetch(`http://localhost:8000/api/projects`)
        .then(res => res.json())
        .then(res => {
          const proj = (res.data || []).find(p => p.id === parseInt(id));
          if (proj) {
            setName(proj.name);
            setDesc(proj.desc || '');
            setLink(proj.link);
          }
        });
    }
  }, [id, isEditing]);

  const handleSubmit = async () => {
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${API_BASE}/${id}` : API_BASE;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, desc, link })
    });
    const data = await res.json();
    if (data.code === 200) {
      navigate('/projects');
    } else {
      alert('Error: ' + (data.msg || 'Unknown error'));
    }
  };

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <h2 className="title is-4">{isEditing ? 'Edit Project' : 'New Project'}</h2>
        <input className="input mb-3" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <textarea className="textarea mb-3" placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} />
        <input className="input mb-3" placeholder="Link (e.g., GitHub)" value={link} onChange={e => setLink(e.target.value)} />
        <button className="button is-dark" onClick={handleSubmit}>Save</button>
      </div>
    </section>
  );
}

export default ProjectEditor;