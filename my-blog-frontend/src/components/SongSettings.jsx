import { useState, useEffect } from 'react';
import { authFetch } from '../utils';

function SongSettings() {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [url, setUrl] = useState('');
  const [cover, setCover] = useState('');
  const [lrc, setLrc] = useState('');
  const [msg, setMsg] = useState('');

  // 服务器上的歌曲文件列表
  const [musicFiles, setMusicFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');

  // 加载当前已保存的歌曲信息
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

  // 加载服务器上的 mp3 文件列表
  useEffect(() => {
    authFetch('/api/admin/music-files').then(r => r.json()).then(data => {
      if (data.code === 200) setMusicFiles(data.data);
    });
  }, []);

  // 从下拉列表选择文件时自动填充 URL 和可能的歌名/歌手
  const handleFileSelect = (filename) => {
    setSelectedFile(filename);
    const newUrl = `http://8.149.141.64/static/music/${filename}`;
    setUrl(newUrl);

    // 尝试解析文件名，格式：歌手 - 歌名.mp3 或 歌名.mp3
    const match = filename.match(/^(.+?)\s*-\s*(.+)\.mp3$/);
    if (match) {
      setArtist(match[1].trim());
      setTitle(match[2].trim());
    } else {
      // 没有分隔符时，仅把文件名（去掉 .mp3）作为歌名
      setTitle(filename.replace(/\.mp3$/, ''));
      setArtist('');
    }
  };

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

        {/* 快速选择已上传的歌曲 */}
        <div className="field">
          <label className="label">Select an uploaded song</label>
          <div className="select is-fullwidth mb-2">
            <select
              value={selectedFile}
              onChange={(e) => handleFileSelect(e.target.value)}
            >
              <option value="">-- Choose a file --</option>
              {musicFiles.map(file => (
                <option key={file} value={file}>{file}</option>
              ))}
            </select>
          </div>
        </div>

        <input
          className="input mb-2"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <input
          className="input mb-2"
          placeholder="Artist"
          value={artist}
          onChange={e => setArtist(e.target.value)}
        />
        <input
          className="input mb-2"
          placeholder="MP3 URL"
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <input
          className="input mb-2"
          placeholder="Cover URL"
          value={cover}
          onChange={e => setCover(e.target.value)}
        />
        <textarea
          className="textarea mb-2"
          placeholder="LRC lyrics (optional)"
          value={lrc}
          onChange={e => setLrc(e.target.value)}
        />
        <button className="button is-dark" onClick={save}>Save</button>
        {msg && <p className="mt-2">{msg}</p>}
      </div>
    </section>
  );
}

export default SongSettings;