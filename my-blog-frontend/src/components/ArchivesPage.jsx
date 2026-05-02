import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authFetch, getCurrentUser, getImageUrl } from '../utils';

function ArchivesPage() {
  const [posts, setPosts] = useState([]);
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    authFetch(`/api/posts`)
      .then(res => res.json())
      .then(res => setPosts(res.data || []))
      .catch(console.error);
  }, []);

  const sorted = [...posts].sort((a, b) => {
    if (order === 'asc') return a.date.localeCompare(b.date);
    return b.date.localeCompare(a.date);
  });

  const handlePostRightClick = async (e, postId) => {
    e.preventDefault();
    const userRes = await getCurrentUser();
    if (userRes.data?.role !== 'admin') return;
    if (!window.confirm('Confirm to delete this post?')) return;
    try {
      const res = await authFetch(`/admin/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

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

        <div className="archives-columns">
          {sorted.map(post => {
            const validImages = (post.images || []).filter(url => url && url.trim() !== '');
            return (
              <Link
                key={post.id}
                to={`/post/${post.id}`}
                className="card-item"
                style={{ color: 'inherit', textDecoration: 'none' }}
                onContextMenu={(e) => handlePostRightClick(e, post.id)}
              >
                <div className="card" style={{ height: '100%' }}>
                  <div className="card-content">
                    <p className="title is-5">{post.title}</p>
                    <p className="subtitle is-6 has-text-grey">{post.date}</p>
                    <p style={{ whiteSpace: 'pre-line' }}>{post.preview}</p>

                    {validImages.length > 0 && (
                      <div className="columns is-multiline is-mobile mt-2">
                        {validImages.length === 1 ? (
                          <div className="column is-12">
                            <figure>
                              <img
                                src={getImageUrl(validImages[0])}
                                alt="preview"
                                style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }}
                              />
                            </figure>
                          </div>
                        ) : (
                          validImages.slice(0, 4).map((url, idx) => (
                            <div key={idx} className="column is-6">
                              <figure className="image is-square">
                                <img
                                  src={getImageUrl(url)}
                                  alt={`img-${idx}`}
                                  style={{ objectFit: 'cover' }}
                                />
                              </figure>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ArchivesPage;