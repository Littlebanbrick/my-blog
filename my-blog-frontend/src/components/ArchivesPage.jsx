import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:8000/api';

function ArchivesPage() {
  const [posts, setPosts] = useState([]);
  const [order, setOrder] = useState('desc'); // 'desc' or 'asc'

  useEffect(() => {
    fetch(`${API_BASE}/posts`)
      .then(res => res.json())
      .then(res => setPosts(res.data || []))
      .catch(console.error);
  }, []);

  const sorted = [...posts].sort((a, b) => {
    if (order === 'asc') return a.date.localeCompare(b.date);
    return b.date.localeCompare(a.date);
  });

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="level">
          <div className="level-left">
            <h1 className="title is-3">Archives</h1>
          </div>
          <div className="level-right">
            <button
              className="button is-small is-light"
              onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
            >
              {order === 'desc' ? 'Newest first' : 'Oldest first'}
            </button>
          </div>
        </div>

        <div className="columns is-multiline">
            {sorted.map(post => (
            <div key={post.id} className="column is-6-tablet is-4-desktop">
                <Link
                to={`/post/${post.id}`}
                style={{ color: 'inherit', textDecoration: 'none', display: 'block', height: '100%' }}
                >
                <div className="card" style={{ height: '100%' }}>
                    <div className="card-content">
                    <p className="title is-5">{post.title}</p>
                    <p className="subtitle is-6 has-text-grey">{post.date}</p>
                    <p style={{ whiteSpace: 'pre-line' }}>{post.preview}</p>
                    </div>
                </div>
                </Link>
            </div>
            ))}
        </div>
      </div>
    </section>
  );
}

export default ArchivesPage;