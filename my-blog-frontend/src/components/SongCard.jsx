import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { authFetch, getCurrentUser } from '../utils';

function SongCard() {
  const [songId, setSongId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const playerContainer = useRef(null);
  const apRef = useRef(null);

  // 获取当前歌曲和管理员状态
  useEffect(() => {
    authFetch('/api/song')
      .then(res => res.json())
      .then(data => {
        if (data.data?.song_id) setSongId(data.data.song_id);
      });
    getCurrentUser().then(user => {
      if (user.data?.role === 'admin') setIsAdmin(true);
    });
  }, []);

  // 初始化播放器
  useEffect(() => {
    if (!songId || !playerContainer.current) return;

    // 等待 APlayer 和 Meting 可用
    const checkInterval = setInterval(() => {
      if (window.APlayer && window.Meting) {
        clearInterval(checkInterval);
        initPlayer();
      }
    }, 100);

    function initPlayer() {
      // 销毁旧实例
      if (apRef.current) {
        apRef.current.destroy();
        apRef.current = null;
      }

      const APlayer = window.APlayer;
      const Meting = window.Meting;

      apRef.current = new APlayer({
        container: playerContainer.current,
        fixed: false,
        autoplay: false,
        theme: '#1a365d',
        loop: 'all',
        order: 'list',
        preload: 'auto',
        volume: 0.7,
        audio: []  // 空数组，由 Meting 填充
      });

      try {
        new Meting({
          server: 'tencent',
          type: 'song',
          mid: songId,
          audio: apRef.current
        });
      } catch (e) {
        console.error('Meting init error:', e);
      }
    }

    return () => {
      clearInterval(checkInterval);
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
          style={{ minHeight: '90px', marginBottom: '0.5rem' }}
        />
      </div>
    </div>
  );
}

export default SongCard;