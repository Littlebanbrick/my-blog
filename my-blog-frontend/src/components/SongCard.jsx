import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authFetch, getCurrentUser } from '../utils';

function SongCard() {
  const [iframeCode, setIframeCode] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    authFetch('/api/song')
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data.iframe_code) {
          setIframeCode(data.data.iframe_code);
        }
      });
    getCurrentUser().then(user => {
      if (user.data?.role === 'admin') setIsAdmin(true);
    });
  }, []);

  // 没有任何歌曲且非管理员时，不显示卡片（避免空白）
  if (!iframeCode && !isAdmin) return null;

  return (
    <div className="card widget">
      <div className="card-content" style={{ padding: '0.75rem' }}>
        {iframeCode ? (
          <div dangerouslySetInnerHTML={{ __html: iframeCode }} />
        ) : (
          <p className="has-text-grey has-text-centered">No music set</p>
        )}
        {isAdmin && (
          <div className="has-text-right mt-2">
            <Link to="/admin/song" className="button is-small is-dark is-light" style={{ fontSize: '0.8rem' }}>
              <span className="icon"><i className="fas fa-edit"></i></span>
              <span>Edit</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default SongCard;