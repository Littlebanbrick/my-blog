import { useState, useEffect } from 'react';
import { authFetch } from '../utils';

function SongSettings() {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [url, setUrl] = useState('');
  const [cover, setCover] = useState('');
  const [lrc, setLrc] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    authFetch('/api/song').then(r => r.json()).then(data => {
      if (data.data) {
        setTitle(data.data.title || '');
        setArtist(data.data.artist || '');
        setUrl(data.data.url || '');
        setCover(data.data.cover || '');
        setLrc(data.data.lrc || '');
      }
    });
  }, []);

  const save = async () => {
    await authFetch('/api/admin/song', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, artist, url, cover, lrc })
    });
    setMsg('Saved!');
  };

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container" style={{ maxWidth: 600 }}>
        <h2 className="title is-4">Song Settings</h2>
        <input className="input mb-2" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)}/>
        <input className="input mb-2" placeholder="Artist" value={artist} onChange={e=>setArtist(e.target.value)}/>
        <input className="input mb-2" placeholder="MP3 URL" value={url} onChange={e=>setUrl(e.target.value)}/>
        <input className="input mb-2" placeholder="Cover URL" value={cover} onChange={e=>setCover(e.target.value)}/>
        <textarea className="textarea mb-2" placeholder="LRC lyrics" value={lrc} onChange={e=>setLrc(e.target.value)}/>
        <button className="button is-dark" onClick={save}>Save</button>
        {msg && <p className="mt-2">{msg}</p>}
      </div>
    </section>
  );
}
export default SongSettings;