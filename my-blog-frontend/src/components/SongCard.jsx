import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { authFetch, getCurrentUser } from '../utils';

function SongCard() {
  const [songId, setSongId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const playerContainer = useRef(null);
  const apRef = useRef(null);

  useEffect(() => {
    authFetch('/api/song')
      .then(res => res.json())
      .then(data => {
        console.log('[SongCard] song_id from API:', data.data?.song_id);
        if (data.data?.song_id) setSongId(data.data.song_id);
      });
    getCurrentUser().then(user => {
      console.log('[SongCard] user role:', user.data?.role);
      if (user.data?.role === 'admin') setIsAdmin(true);
    });
  }, []);

  useEffect(() => {
    console.log('[SongCard] current songId:', songId);
    if (!songId || !playerContainer.current) {
      console.warn('[SongCard] missing songId or container ref');
      return;
    }

    // 检查全局对象
    console.log('[SongCard] window.APlayer:', window.APlayer);
    console.log('[SongCard] window.Meting:', window.Meting);

    if (!window.APlayer || !window.Meting) {
      console.warn('[SongCard] APlayer or Meting not loaded yet, waiting...');
      return;
    }

    // 销毁旧播放器
    if (apRef.current) {
      console.log('[SongCard] destroying previous APlayer instance');
      apRef.current.destroy();
      apRef.current = null;
    }

    const APlayer = window.APlayer;
    const Meting = window.Meting;

    console.log('[SongCard] creating APlayer instance...');
    apRef.current = new APlayer({
      container: playerContainer.current,
      fixed: false,
      autoplay: false,
      theme: '#1a365d',
      loop: 'all',
      order: 'list',
      preload: 'auto',
      volume: 0.7,
      audio: []  // Meting 会填充
    });

    console.log('[SongCard] APlayer instance created, opts:', apRef.current.opts);
    console.log('[SongCard] container element:', playerContainer.current);
    console.log('[SongCard] container current HTML:', playerContainer.current.innerHTML);

    try {
      new Meting({
        server: 'tencent',
        type: 'song',
        mid: songId,
        audio: apRef.current
      });
      console.log('[SongCard] Meting initialized');
    } catch (e) {
      console.error('[SongCard] Meting init error:', e);
    }

    return () => {
      console.log('[SongCard] cleanup');
      if (apRef.current) {
        apRef.current.destroy();
        apRef.current = null;
      }
    };
  }, [songId]);

  if (!songId) return null;

  return (
    <div className="card widget">
      <div className="card-content" style={{ padding: '0.5rem' }}>
        <div
          ref={playerContainer}
          style={{
            minHeight: '90px',
            backgroundColor: '#f0f0f0',   // 临时背景，方便看容器是否存在
            border: '1px dashed #ccc'
          }}
        />
      </div>
    </div>
  );
}

export default SongCard;