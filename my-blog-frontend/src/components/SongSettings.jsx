import { useState, useEffect } from 'react';
import { authFetch } from '../utils';

function SongSettings() {
  const [songId, setSongId] = useState('');
  const [link, setLink] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    authFetch('/api/song').then(res => res.json()).then(data => {
      if (data.data?.song_id) setSongId(data.data.song_id);
    });
  }, []);

  const handleLookup = async () => {
    if (!link.trim()) return;
    const res = await authFetch('/api/admin/song/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ link })
    });
    const data = await res.json();
    if (data.code === 200) {
      setSongId(data.data.song_id);
      setMessage('Song ID found! Save to apply.');
    } else {
      setMessage(data.msg || 'Failed');
    }
  };

  const handleSave = async () => {
    await authFetch('/api/admin/song', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ song_id: songId })
    });
    setMessage('Saved!');
  };

  const handleRemove = async () => {
    if (!window.confirm('Remove current song?')) return;
    await authFetch('/api/admin/song', { method: 'DELETE', credentials: 'include' });
    setSongId('');
    setMessage('Removed!');
  };

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container" style={{ maxWidth: '600px' }}>
        <h2 className="title is-4">Song Settings</h2>
        <p className="has-text-grey mb-3">Paste a QQ Music song link to extract its ID.</p>
        <div className="field has-addons">
          <div className="control is-expanded">
            <input className="input" placeholder="https://y.qq.com/..." value={link} onChange={e => setLink(e.target.value)} />
          </div>
          <div className="control">
            <button className="button is-dark" onClick={handleLookup}>Get ID</button>
          </div>
        </div>

        <div className="field mt-3">
          <label className="label">Song ID</label>
          <input className="input" value={songId} onChange={e => setSongId(e.target.value)} placeholder="000bog5B2DYgHN" />
        </div>

        <div className="buttons mt-3">
          <button className="button is-dark" onClick={handleSave}>Save</button>
          <button className="button is-danger is-light" onClick={handleRemove}>Remove</button>
        </div>
        {message && <p className="has-text-centered mt-2">{message}</p>}

        {songId && (
          <div className="box mt-4">
            <h4 className="title is-5">Preview</h4>
            <div id="preview-player" />
          </div>
        )}
      </div>
    </section>
  );
}

export default SongSettings;