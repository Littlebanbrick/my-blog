// src/components/AboutPage.jsx
import { useState, useEffect } from 'react';

function AboutPage() {
  const [user, setUser] = useState(null);
  const [typed1, setTyped1] = useState('');
  const [typed2, setTyped2] = useState('');
  const [typed3, setTyped3] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [counter, setCounter] = useState({ posts: 0, likes: 0, comments: 0 });
  const [activeLine, setActiveLine] = useState(1);

  const sentence1 = 'Hello, world! I build things for the web.';
  const sentence2 = 'Crafting experiences that we enjoy and remember.';
  const sentence3 = 'Every line of code is a small step toward something bigger.';

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.code === 200) setUser(data.data); })
      .catch(() => {});

    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        setCounter({
          posts: data.posts || 0,
          likes: data.likes || 0,
          comments: data.comments || 0,
        });
      })
      .catch(() => {});

    const typeSentence = (sentence, setter, line, callback) => {
      let idx = 0;
      setActiveLine(line);
      const timer = setInterval(() => {
        if (idx < sentence.length) {
          setter(sentence.slice(0, idx + 1));
          idx++;
        } else {
          clearInterval(timer);
          if (callback) setTimeout(callback, 300);
        }
      }, 80);
      return timer;
    };

    typeSentence(sentence1, setTyped1, 1, () => {
      typeSentence(sentence2, setTyped2, 2, () => {
        typeSentence(sentence3, setTyped3, 3, () => {
          setShowCursor(true);
          setActiveLine(0);
        });
      });
    });
  }, []);

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="hero is-medium is-dark is-bold mb-5" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="hero-body has-text-centered">
            <h1 className="title is-2 has-text-white mb-2">Johnny Wang</h1>
            <div
              className="subtitle is-5 mt-3"
              style={{
                fontFamily: '"Cascadia Code", monospace',
                minHeight: '2rem',
                lineHeight: '2.5rem'
              }}
            >
              <p>
                {typed1}
                {activeLine === 1 && showCursor && (
                  <span className="is-blinking" style={{ animation: 'blink 1s step-end infinite' }}>|</span>
                )}
              </p>
              <p>
                {typed2}
                {activeLine === 2 && showCursor && (
                  <span className="is-blinking" style={{ animation: 'blink 1s step-end infinite' }}>|</span>
                )}
              </p>
              <p>
                {typed3}
                {activeLine === 3 && showCursor && (
                  <span className="is-blinking" style={{ animation: 'blink 1s step-end infinite' }}>|</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* 个人简介卡片 */}
        <div className="box mb-5" style={{ borderRadius: '8px' }}>
          <div className="columns is-vcentered">
            <div className="column is-narrow">
              <figure className="image is-128x128">
                <img className="is-rounded" src="/myAvatar.jpg" alt="avatar" />
              </figure>
            </div>
            <div className="column">
              <h2 className="title is-4">About Me</h2>
              <p className="content">
                A freshman majoring in CS from Zhejiang Univ.  
                - Curious, consistent, and always building
              </p>
            </div>
          </div>
        </div>

        {/* GitHub Contributions & Stats */}
        <div className="columns mb-5">
          {/* 左侧：贡献图 + 技术栈 占 2/3 */}
          <div className="column is-8">
            <div className="box has-text-centered mb-4" style={{ borderRadius: '8px' }}>
              <h3 className="title is-5 mb-4">GitHub Contributions</h3>
              <img 
                src="https://ghchart.rshah.org/Littlebanbrick" 
                alt="GitHub contributions chart" 
                style={{ maxWidth: '100%', borderRadius: '6px' }}
              />
            </div>

            <div className="box has-text-centered" style={{ borderRadius: '8px' }}>
              <h3 className="title is-5 mb-4">Tools & Technologies</h3>
              <div className="tags are-medium is-centered">
                {[
                  { name: 'React', url: 'https://react.dev/' },
                  { name: 'FastAPI', url: 'https://fastapi.tiangolo.com/' },
                  { name: 'SQLite', url: 'https://www.sqlite.org/' },
                  { name: 'Docker', url: 'https://www.docker.com/' },
                  { name: 'Bulma', url: 'https://bulma.io/' },
                  { name: 'JavaScript', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
                  { name: 'Python', url: 'https://www.python.org/' },
                  { name: 'Git', url: 'https://git-scm.com/' },
                  { name: 'Nginx', url: 'https://nginx.org/' },
                  { name: 'Linux', url: 'https://www.kernel.org/' }
                ].map(tech => (
                  <a
                    key={tech.name}
                    href={tech.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tag is-dark"
                    style={{ margin: '4px', textDecoration: 'none' }}
                  >
                    {tech.name}
                  </a>
                ))}
              </div>
            </div>

            <div className="box has-text-centered" style={{ borderRadius: '8px' }}>
              <h3 className="title is-5 mb-4">Find me on</h3>
              <div className="buttons is-centered">
                <a href="https://github.com/Littlebanbrick" className="button is-dark" target="_blank" rel="noopener noreferrer">
                  <span className="icon"><i className="fab fa-github"></i></span>
                  <span>GitHub</span>
                </a>
                <a href="https://space.bilibili.com/3546895630731348" className="button is-light" target="_blank" rel="noopener noreferrer">
                  <span className="icon"><i className="fa-brands fa-bilibili"></i></span>
                  <span>Bilibili</span>
                </a>
                <a href="https://x.com/JohnnyWang5784" className="button is-dark" target="_blank" rel="noopener noreferrer">
                  <span className="icon"><i className="fa-brands fa-x-twitter"></i></span>
                  <span>Twitter</span>
                </a>
              </div>
            </div>
            </div>

          {/* 右侧：统计数据垂直排列占 1/3 */}
          <div className="column is-4">
              {[
                { label: 'Posts', value: counter.posts, icon: 'fa-solid fa-pen-to-square' },
                { label: 'Likes', value: counter.likes, icon: 'fa-regular fa-heart' },
                { label: 'Comments', value: counter.comments, icon: 'fa-regular fa-comment-dots' },
              ].map((stat, idx) => (
              <div key={idx} className="mb-4">
                <div className="box has-text-centered" style={{ borderRadius: '8px', transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <span className="icon is-large"><i className={`${stat.icon} fa-2x`}></i></span>
                      <p className="title is-3 mt-3 mb-1">{stat.value}</p>
                    <p className="heading">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

      {/* 打字机闪烁动画样式 */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
      </div>
    </section>
  );
}

export default AboutPage;