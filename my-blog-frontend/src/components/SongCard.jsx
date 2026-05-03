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
    
    // 清理旧的播放器实例
    if (apRef.current) {
      apRef.current.destroy();
      apRef.current = null;
    }

    // 从后端获取歌曲详情
    authFetch(`/api/song/detail?mid=${songId}`)
      .then(res => res.json())
      .then(data => {
        if (data.code !== 200 || !data.data?.url) {
          console.error('Failed to load song detail');
          return;
        }
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