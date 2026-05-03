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

    // 清理旧的播放器
    if (apRef.current) {
      apRef.current.destroy();
      apRef.current = null;
    }

    // 确保 APlayer 和 Meting 已加载
    if (!window.APlayer || !window.Meting) {
      // 加载 APlayer 样式
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css';
      document.head.appendChild(link);

      // 加载 APlayer 脚本
      const scriptAP = document.createElement('script');
      scriptAP.src = 'https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js';
      document.body.appendChild(scriptAP);

      // 加载 Meting 脚本
      const scriptM = document.createElement('script');
      scriptM.src = 'https://cdn.jsdelivr.net/npm/meting@2/dist/Meting.min.js';
      scriptM.onload = () => {
        // Meting 加载完毕后初始化
        initPlayer();
      };
      document.body.appendChild(scriptM);
    } else {
      // 已加载，直接初始化
      initPlayer();
    }

    function initPlayer() {
      const APlayer = window.APlayer;
      const Meting = window.Meting;
      if (!APlayer || !Meting) return;

      // 创建 APlayer 实例
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

      // 用 Meting 加载歌曲
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
  }, [songId]);

  if (!songId && !isAdmin) return null;

  return (
    <div className="card widget">
      <div className="card-content" style={{ padding: '0.5rem' }}>
        <div ref={playerContainer} />
      </div>
    </div>
  );
}

export default SongCard;