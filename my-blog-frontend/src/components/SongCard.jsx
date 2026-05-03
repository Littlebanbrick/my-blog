import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { authFetch, getCurrentUser } from '../utils';

function SongCard() {
  const [songId, setSongId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const playerContainer = useRef(null);
  const apRef = useRef(null);

  useEffect(() => {
    authFetch('/api/song').then(res => res.json()).then(data => {
      if (data.data?.song_id) setSongId(data.data.song_id);
    });
    getCurrentUser().then(user => {
      if (user.data?.role === 'admin') setIsAdmin(true);
    });
  }, []);

  useEffect(() => {
    if (!songId || !playerContainer.current) return;

    // 动态引入 APlayer 和 Meting（避免 npm 包）
    if (!window.APlayer) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js';
      script.onload = () => {
        initPlayer();
      };
      document.body.appendChild(script);
    } else {
      initPlayer();
    }

    function initPlayer() {
      if (apRef.current) {
        apRef.current.destroy();
        apRef.current = null;
      }

      const APlayer = window.APlayer;
      if (!APlayer) return;

      apRef.current = new APlayer({
        container: playerContainer.current,
        fixed: false,
        autoplay: false,
        theme: '#1a365d',
        loop: 'all',
        order: 'list',
        preload: 'auto',
        volume: 0.7,
        audio: []
      });

      // 使用 Meting 从 QQ 音乐获取歌曲
      const metScript = document.createElement('script');
      metScript.src = 'https://cdn.jsdelivr.net/npm/meting@2/dist/Meting.min.js';
      metScript.onload = () => {
        const Meting = window.Meting;
        if (!Meting) return;
        new Meting({
          server: 'tencent',
          type: 'song',
          mid: songId,
          audio: apRef.current
        });
      };
      document.body.appendChild(metScript);
    }
  }, [songId]);

  if (!songId && !isAdmin) return null;

  return (
    <div className="card widget">
      <div className="card-content" style={{ padding: '0.5rem' }}>
        <div ref={playerContainer} />
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