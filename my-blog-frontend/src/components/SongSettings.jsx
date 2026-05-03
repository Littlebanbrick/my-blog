import { useState, useEffect } from 'react';
import { authFetch } from '../utils';

function SongSettings() {
  const [iframeCode, setIframeCode] = useState('');
  const [link, setLink] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authFetch('/api/song')
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data.iframe_code) {
          setIframeCode(data.data.iframe_code);
        }
      });
  }, []);

  // 从链接获取 iframe
  const handleLookup = async () => {
    if (!link.trim()) return;
    setLoading(true);
    setMessage('');
    const res = await authFetch('/api/admin/song/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ link })
    });
    const data = await res.json();
    if (data.code === 200) {
      setIframeCode(data.data.iframe_code);
      setMessage('Iframe generated! You can save it now.');
    } else {
      setMessage(data.msg || 'Failed to get song info');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    await authFetch('/api/admin/song', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ iframe_code: iframeCode })
    });
    setMessage('Saved!');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleRemove = async () => {
    if (!window.confirm('Remove current song?')) return;
    await authFetch('/api/admin/song', {
      method: 'DELETE',
      credentials: 'include'
    });
    setIframeCode('');
    setMessage('Removed!');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container" style={{ maxWidth: '700px' }}>
        <h2 className="title is-4">Song Settings</h2>
        <p className="has-text-grey mb-3">Paste a QQ Music song link and click "Get Iframe" to auto-fill the player.</p>
        
        <div className="field has-addons">
          <div className="control is-expanded">
            <input
              className="input"
              type="text"
              placeholder="https://y.qq.com/..."
              value={link}
              onChange={e => setLink(e.target.value)}
            />
          </div>
          <div className="control">
            <button className="button is-dark" onClick={handleLookup} disabled={loading}>
              {loading ? 'Loading...' : 'Get Iframe'}
            </button>
          </div>
        </div>

        <textarea
          className="textarea mt-3"
          rows={6}
          value={iframeCode}
          onChange={e => setIframeCode(e.target.value)}
          placeholder="Or paste iframe code manually"
        />

        <div className="buttons mt-3">
          <button className="button is-dark" onClick={handleSave}>Save</button>
          <button className="button is-light" style={{ color: '#8B0000' }} onClick={handleRemove}>Remove</button>
        </div>
        {message && <p className="has-text-centered mt-2" style={{ color: message.startsWith('Iframe generated') ? '#48c774' : '#da1037' }}>{message}</p>}

        <hr />
        <h3 className="title is-5 mb-3">Preview</h3>
        {iframeCode ? (
          <div dangerouslySetInnerHTML={{ __html: iframeCode }} />
        ) : (
          <p className="has-text-grey">No song set.</p>
        )}
      </div>
    </section>
  );
}

export default SongSettings;