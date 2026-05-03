import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { authFetch, getCurrentUser } from '../utils';

function SongCard() {
  const [songId, setSongId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const playerContainer = useRef(null);
  const apRef = useRef(null);

  // 获取歌曲 ID 和管理员状态
  useEffect(() => {
    authFetch('/api/song').then(res => res.json()).then(data => {
      if (data.data?.song_id) setSongId(data.data.song_id);
    });
    getCurrentUser().then(user => {
      if (user.data?.role === 'admin') setIsAdmin(true);
    });
  }, []);

  // 当 songId 变化时初始化播放器
  useEffect(() => {
    if (!songId || !playerContainer.current) return;

    // 清理旧播放器
    if (apRef.current) {
      apRef.current.destroy();
      apRef.current = null;
    }

    // 动态加载 APlayer 的 CSS 和 JS
    const loadAPlayer = () => {
      return new Promise((resolve, reject) => {
        if (window.APlayer) {
          resolve();
          return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/lib/APlayer.min.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = '/lib/APlayer.min.js';
        script.onload = () => {
          if (window.APlayer) resolve();
          else reject(new Error('APlayer not loaded'));
        };
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const initPlayer = async () => {
      try {
        await loadAPlayer();
        // 从后端获取歌曲详情
        const res = await authFetch(`/api/song/detail?mid=${songId}`);
        const data = await res.json();
        if (data.code !== 200 || !data.data?.url) {
          console.error('Invalid song detail:', data);
          return;
        }

        const song = data.data;
        apRef.current = new window.APlayer({
          container: playerContainer.current,
          fixed: false,
          autoplay: false,
          theme: '#1a365d',
          loop: 'all',
          order: 'list',
          preload: 'auto',
          volume: 0.7,
          audio: [{
            name: song.title || 'Unknown',
            artist: song.artist || 'Unknown',
            url: song.url,
            cover: song.cover || '',
            lrc: song.lrc || ''
          }]
        });
      } catch (err) {
        console.error('SongCard init failed:', err);
      }
    };

    initPlayer();

    return () => {
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
        <div ref={playerContainer} style={{ minHeight: '90px' }} />
      </div>
    </div>
  );
}

export default SongCard;