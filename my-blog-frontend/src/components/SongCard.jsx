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

    // 销毁旧播放器
    if (apRef.current) {
      apRef.current.destroy();
      apRef.current = null;
    }

    const APlayer = window.APlayer;
    const Meting = window.Meting;
    if (!APlayer || !Meting) return;

    // 创建新播放器
    apRef.current = new APlayer({
      container: playerContainer.current,
      fixed: false,
      autoplay: false,
      theme: '#1a365d',
      loop: 'all',
      order: 'list',
      preload: 'auto',
      volume: 0.7,
      audio: []   // 音频列表留空，由 Meting 填充
    });

    // 使用 Meting 从 QQ 音乐获取歌曲信息
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

    // 清理函数
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
        <div ref={playerContainer} />
      </div>
    </div>
  );
}

export default SongCard;