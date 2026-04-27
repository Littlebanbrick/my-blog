import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function StudyNotesPage() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const loadNotes = async () => {
      // 导入所有 .md 文件，获取原始内容
      const modules = import.meta.glob('../assets/notes/*.md', { query: '?raw', import: 'default' });

      const loaded = await Promise.all(
        Object.keys(modules).map(async (path) => {
          const raw = await modules[path]();
          // 从路径提取文件名作为标识
          const fileName = path.split('/').pop().replace('.md', '');
          return {
            id: fileName,
            title: fileName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            raw,
            // 提取第一行作为摘要（可选）
            summary: raw.split('\n').filter(line => line.trim() !== '').slice(0, 2).join(' '),
          };
        })
      );

      // 按文件名降序排列（可改为按修改时间，但这里用文件名字符顺序）
      const sorted = loaded.sort((a, b) => b.id.localeCompare(a.id));
      setNotes(sorted);
    };

    loadNotes();
  }, []);

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <h1 className="title is-3 mb-5">Study Notes</h1>

        <div className="columns is-multiline">
          {notes.map(note => (
            <div key={note.id} className="column is-6-tablet is-4-desktop">
              <Link to={`/study-notes/${note.id}`}>
                <div className="card" style={{ height: '100%' }}>
                  <div className="card-content">
                    <p className="title is-5">
                      {note.title}
                    </p>
                    <p className="has-text-grey is-size-7 mb-3">{note.summary}</p>
                    <div className="content" style={{ whiteSpace: 'pre-line', fontSize: '0.9rem' }}>
                      {note.summary}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StudyNotesPage;