import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { authFetch, getCurrentUser } from '../utils';

function SongCard() {
  const [song, setSong] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const containerRef = useRef(null);
  const apRef = useRef(null);

  useEffect(() => {
    authFetch('/api/song').then(r => r.json()).then(data => {
      if (data.data?.url) setSong(data.data);
    });
    getCurrentUser().then(u => {
      if (u.data?.role === 'admin') setIsAdmin(true);
    });
  }, []);

  useEffect(() => {
    if (!song || !containerRef.current) return;
    if (apRef.current) { apRef.current.destroy(); apRef.current = null; }

    const load = () => {
      if (window.APlayer) return Promise.resolve();
      return new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet'; link.href = '/lib/APlayer.min.css';
        document.head.appendChild(link);
        const script = document.createElement('script');
        script.src = '/lib/APlayer.min.js';
        script.onload = resolve;
        document.body.appendChild(script);
      });
    };

    load().then(() => {
      apRef.current = new window.APlayer({
        container: containerRef.current,
        fixed: false,
        autoplay: false,
        theme: '#1a365d',
        audio: [{
          name: song.title || 'Music',
          artist: song.artist || 'Unknown',
          url: song.url,
          cover: song.cover || '',
          lrc: song.lrc || ''
        }]
      });
    });

    return () => { if (apRef.current) apRef.current.destroy(); };
  }, [song]);

  if (!song) return null;

  return (
    <div className="card widget">
      <div className="card-content" style={{ padding: '0.5rem' }}>
        <div ref={containerRef} style={{ minHeight: '90px' }} />
      </div>
    </div>
  );
}
export default SongCard;