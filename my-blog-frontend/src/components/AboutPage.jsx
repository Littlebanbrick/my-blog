// src/components/AboutPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authFetch } from '../utils';

function AboutPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    authFetch('/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.code === 200) setUser(data.data);
      })
      .catch(() => {});
  }, []);

  const todayCommit = `feat: implement sticky sidebar scrolling, nested comment replies, admin upload management for photos/notes/projects, fix post sorting, and improve overall UI/UX`;

  const learningJournal = [
    {
      day: 'Day 1 – 基础布局与组件化',
      content: `今天真正理解了 React 组件化的意义。把页面拆成 ProfileCard、MomentList、RightWidgets 这些独立零件，每个零件只关心自己的数据和样式，拼起来就是一个完整的博客。Bulma 的栅格系统用起来很像 Bootstrap，但更轻量，\`columns is-3\` 这种语义化类名让布局变得直观。不过 CSS 的 sticky 定位比想象中难调，父元素的 overflow 和 flex 会直接破坏粘性效果，折腾了好几个小时才让左右侧边栏在中间滚动时纹丝不动。`
    },
    {
      day: 'Day 2 – 从假数据到真实 API',
      content: `用 FastAPI 写了第一个接口，把硬编码在 React 里的假数据搬到了后端。配置 CORS 中间件就像在门口贴了一张许可告示，允许 5173 端口的小朋友进来拿数据。fetch 请求返回的 JSON 和之前定义的假数据结构一模一样，改三行代码就把整个首页的数据源切到了后端。虽然还只是从 Python 列表读取，但那种“数据真的在网络上多走了一圈”的感觉很奇妙。`
    },
    {
      day: 'Day 3 – 数据库与动态交互',
      content: `SQLite 比想象中友好，就是一个 .db 文件。用 SQLAlchemy 定义表结构，再用 databases 库做异步查询，代码量很少。实现了点赞切换和评论提交，发现前后端状态同步是个大坑——用户点赞后，另一个页面可能看不到变化，必须让两个页面都从后端拿最新数据。React 的 useEffect 依赖数组用好了，从详情页返回列表页会自动重新拉取文章和点赞状态，问题就解决了。`
    },
    {
      day: 'Day 4 – 鉴权与文件管理',
      content: `JWT 存在 httpOnly cookie 里防止 XSS，SameSite=Lax 挡住大部分 CSRF，再加上 bcrypt 哈希密码，感觉安全性勉强及格。但最实用的还是文件上传管理：用 FormData 把图片从前端直传到后端，后端写入 assets 目录，再返回 URL，管理员界面一下子就通透了。笔记和项目也都做了类似的 CRUD 接口，终于不用再手动改文件夹了。`
    },
    {
      day: 'Day 5 – 全栈思维与工程化',
      content: `整个流程走下来，最大的收获不是某个具体技术，而是明白了“全栈”到底在做什么：前端把界面画好，后端把数据存好，中间靠 HTTP 协议和 JSON 串起所有逻辑。踩过的坑——callback hell 变 async/await、组件重新渲染导致 token 被消费两次、sticky 失效排查父元素 overflow——每一个都逼着我去理解浏览器和框架的底层原理。现在再看到 GitHub 上别人的博客，大概能猜出它是怎么搭的了。`
    }
  ];

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="card mb-5">
          <div className="card-content">
            <div className="media">
              <div className="media-left">
                <figure className="image is-128x128">
                  <img
                    className="is-rounded"
                    src="/src/assets/BRICK_ICON.png"
                    alt="Avatar"
                  />
                </figure>
              </div>
              <div className="media-content">
                <p className="title is-3">Johnny Wang</p>
                <p className="subtitle is-5 has-text-grey">Full-stack learner · Blogger · Open source enthusiast</p>
                <div className="buttons">
                  <a
                    className="button is-small is-light"
                    href="https://github.com/Littlebanbrick"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="icon"><i className="fab fa-github"></i></span>
                    <span>GitHub</span>
                  </a>
                  <a
                    className="button is-small is-light"
                    href="https://space.bilibili.com/3546895630731348"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="icon"><i className="fa-brands fa-bilibili"></i></span>
                    <span>Bilibili</span>
                  </a>
                  <a
                    className="button is-small is-light"
                    href="https://x.com/JohnnyWang5784"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="icon"><i className="fa-brands fa-x-twitter"></i></span>
                    <span>Twitter</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="content">
              <p>
                Welcome to my blog! I'm a university student who loves turning ideas into code. 
                This site is built from scratch with React, FastAPI, and SQLite — a playground for learning 
                and sharing what I've discovered along the way.
              </p>
            </div>
          </div>
        </div>

        <div className="card mb-5">
          <div className="card-content">
            <h2 className="title is-4">
              <span className="icon-text">
                <span className="icon"><i className="fas fa-code-branch"></i></span>
                <span>Today's Commit</span>
              </span>
            </h2>
            <div className="box has-background-dark has-text-white">
              <pre className="has-text-white" style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                git commit -m "{todayCommit}"
              </pre>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <h2 className="title is-4">
              <span className="icon-text">
                <span className="icon"><i className="fas fa-book-open"></i></span>
                <span>Learning Journal: 5 Days of Building My Blog</span>
              </span>
            </h2>
            <div className="content">
              {learningJournal.map((entry, index) => (
                <div key={index} className="mb-4">
                  <h4 className="title is-5 mb-2">{entry.day}</h4>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{entry.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <span className="tag is-dark mr-1">React</span>
          <span className="tag is-dark mr-1">FastAPI</span>
          <span className="tag is-dark mr-1">SQLite</span>
          <span className="tag is-dark mr-1">Bulma</span>
          <span className="tag is-dark mr-1">Docker</span>
          <span className="tag is-dark mr-1">JavaScript</span>
          <span className="tag is-dark mr-1">Python</span>
        </div>
      </div>
    </section>
  );
}

export default AboutPage;