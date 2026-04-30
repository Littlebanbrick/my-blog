// src/components/AboutPage.jsx
import { useState, useEffect } from 'react';

function AboutPage() {
  const [user, setUser] = useState(null);
  const [typed, setTyped] = useState('');
  const fullSentence = 'Hello, world! I build things for the web.';
  const [counter, setCounter] = useState({ posts: 0, likes: 0, comments: 0 });

  useEffect(() => {
    // 获取当前用户（可选）
    fetch('/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.code === 200) setUser(data.data); })
      .catch(() => {});

    // 统计数字
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

    // 打字机效果
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < fullSentence.length) {
        setTyped(fullSentence.slice(0, idx + 1));
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        {/* 头部英雄区域 */}
        <div className="hero is-medium is-dark is-bold mb-5" style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <div className="hero-body has-text-centered">
            <h1 className="title is-2 has-text-white">Johnny Wang</h1>
            <p className="subtitle is-5 mt-3" style={{ fontFamily: 'monospace', minHeight: '2rem' }}>
              <span>{typed}</span><span className="is-blinking" style={{ opacity: 1, animation: 'blink 1s step-end infinite' }}>|</span>
            </p>
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
                I'm a university student and a self-taught full‑stack developer.
                I built this blog from scratch using React, FastAPI, and SQLite – and yes, it's containerized with Docker.
                I love turning ideas into real applications, breaking things, and fixing them back even better.
              </p>
            </div>
          </div>
        </div>

        {/* 动态统计数字 */}
        <div className="columns mb-5">
          {[
            { label: 'Posts', value: counter.posts, icon: 'fa-pencil' },
            { label: 'Likes', value: counter.likes, icon: 'fa-heart' },
            { label: 'Comments', value: counter.comments, icon: 'fa-comment-dots' },
          ].map((stat, idx) => (
            <div className="column is-4" key={idx}>
              <div className="box has-text-centered" style={{ borderRadius: '8px', transition: 'transform 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                   onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <span className="icon is-large has-text-primary"><i className={`fas ${stat.icon} fa-2x`}></i></span>
                <p className="title is-3 mt-3 mb-1">{stat.value}</p>
                <p className="heading">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 技术栈展示 */}
        <div className="box mb-5" style={{ borderRadius: '8px' }}>
          <h3 className="title is-5 mb-4">Tools & Technologies</h3>
          <div className="tags are-medium">
            {['React', 'FastAPI', 'SQLite', 'Docker', 'Bulma', 'JavaScript', 'Python', 'Git', 'Nginx', 'Linux'].map(tech => (
              <span key={tech} className="tag is-dark" style={{ margin: '4px' }}>{tech}</span>
            ))}
          </div>
        </div>

        {/* 社交媒体链接 */}
        <div className="box has-text-centered" style={{ borderRadius: '8px' }}>
          <h3 className="title is-5 mb-4">Find me on</h3>
          <div className="buttons is-centered">
            <a href="https://github.com/Littlebanbrick" className="button is-dark" target="_blank" rel="noopener noreferrer">
              <span className="icon"><i className="fab fa-github"></i></span>
              <span>GitHub</span>
            </a>
            <a href="https://space.bilibili.com/3546895630731348" className="button is-danger" target="_blank" rel="noopener noreferrer">
              <span className="icon"><i className="fa-brands fa-bilibili"></i></span>
              <span>Bilibili</span>
            </a>
            <a href="https://x.com/JohnnyWang5784" className="button is-link" target="_blank" rel="noopener noreferrer">
              <span className="icon"><i className="fa-brands fa-x-twitter"></i></span>
              <span>Twitter</span>
            </a>
          </div>
        </div>
      </div>

      {/* 打字机闪烁动画样式 */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </section>
  );
}

export default AboutPage;