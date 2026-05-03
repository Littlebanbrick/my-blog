import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { authFetch, getCurrentUser } from '../utils';
import APlayer from 'aplayer';
import 'aplayer/dist/APlayer.min.css';

function SongCard() {
  const [songId, setSongId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const playerContainer = useRef(null);
  const apRef = useRef(null);

  // 获取当前歌曲 ID 和管理员状态
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

  // 当 songId 变化时，加载歌曲细节并初始化播放器
  useEffect(() => {
    if (!songId || !playerContainer.current) return;

    // 清理旧的播放器
    if (apRef.current) {
      apRef.current.destroy();
      apRef.current = null;
    }

    let cancelled = false;

    authFetch(`/api/song/detail?mid=${songId}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled || data.code !== 200 || !data.data) return;

        const song = data.data;
        apRef.current = new APlayer({
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
      })
      .catch(console.error);

    return () => { cancelled = true; };
  }, [songId]);

  // 没有歌曲时不显示
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