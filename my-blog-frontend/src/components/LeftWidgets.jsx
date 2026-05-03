// src/components/LeftWidgets.jsx
import { useState, useEffect } from 'react'
import { authFetch } from '../utils'
import { Link} from 'react-router-dom'

function ProfileCard() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rotation, setRotation] = useState(0)
  const [quote, setQuote] = useState({ text: 'Loading...', from: '', author: '' })

  useEffect(() => {
    authFetch(`/api/profile`)
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch profile:', err);
        setLoading(false);
      });
  }, []);

  const handleAvatarClick = () => {
    setRotation(prev => prev + 360);
  };

  const authFetchQuote = async () => {
    try {
      const res = await fetch('https://v1.hitokoto.cn/')
      const data = await res.json()
      setQuote({
        text: data.hitokoto,
        from: data.from,
        author: data.creator
      })
    } catch (error) {
      setQuote({
        text: 'Where there is a will, there is a way.',
        from: 'Proverb',
        author: 'Unknown'
      })
    }
  }

  useEffect(() => {
    authFetchQuote()
  }, [])

  function LinksCard() {
    return (
      <div className="card widget">
        <div className="card-content">
          <h3 className="menu-label mb-2">
            <i className="fas fa-link mr-2"></i>LINKS
          </h3>
          <ul className="menu-list">
            <li>
              <a href="https://en.wikipedia.org/wiki/Main_Page/" target="_blank" rel="noopener" className="level is-mobile">
                <span className="level-left mb-1" style={{ flex: 1, wordBreak: 'break-word' }}>
                  Wikipedia
                </span>
                <span className="level-right">
                  <span className="level-item tag"
                    style={{
                      width: '100px',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >en.wikipedia.org</span>
                </span>
              </a>
            </li>
            <li>
              <a href="http://cspo.zju.edu.cn/" target="_blank" rel="noopener" className="level is-mobile">
                <span className="level-left mb-1" style={{ flex: 1, wordBreak: 'break-word' }}>
                  ZJU CCST
                </span>
                <span className="level-right">
                  <span className="level-item tag"
                    style={{
                      width: '100px',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >cspo.zju.edu.cn</span>
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="card widget"><div className="card-content">Loading profile...</div></div>;
  }

  return (
    <>
    <div className={loading ? '' : 'moment-slide-up'}>
      <div className="card widget" data-type="profile">
        <div className="card-content">
          {/* Avatar and basic info */}
          <nav className="level">
            <div className="level-item has-text-centered flex-shrink-1">
              <div>
                <figure className="image is-128x128 mx-auto mb-2">
                  <img
                    src="/myAvatar.jpg"
                    alt="avatar"
                    className="is-rounded"
                    onClick={handleAvatarClick}
                    style={{
                      width: '128px',
                      height: '128px',
                      objectFit: 'cover',
                      transform: `rotate(${rotation}deg)`,
                      transition: 'transform 0.6s ease-in-out',
                      cursor: 'pointer',
                      borderRadius: '50%'
                    }}
                  />
                </figure>
                <p className="title is-size-4 is-block" style={{ lineHeight: 'inherit' }}>
                  {profile.name}
                </p>
                <p className="is-size-6 is-block">{profile.motto}</p>
                <p className="is-size-6 is-flex is-justify-content-center">
                  <i
                      className="fa-solid fa-location-dot mr-1 is-size-7"
                      style={{ position: 'relative', top: '5px' }}
                  ></i>
                  <span>{profile.location}</span>
                </p>
              </div>
            </div>
          </nav>

          {/* Stats: Posts, Likes, Comments */}
          <nav className="level is-mobile">
            <div className="level-item has-text-centered is-marginless">
              <div style={{ minWidth: '60px' }}>
                <p className="heading">Posts</p>
                <a href="/archives/">
                  <p className="title">{profile.posts}</p>
                </a>
              </div>
            </div>
            <div className="level-item has-text-centered is-marginless">
              <div style={{ minWidth: '60px' }}>
                <p className="heading">Likes</p>
                <a href="/archives/">
                  <p className="title">{profile.likes}</p>
                </a>
              </div>
            </div>
            <div className="level-item has-text-centered is-marginless">
              <div style={{ minWidth: '60px' }}>
                <p className="heading">Comments</p>
                <a href="/archives/">
                  <p className="title">{profile.comments}</p>
                </a>
              </div>
            </div>
          </nav>

          {/* Hitokoto section (click to refresh) */}
          <div>
            <hr />
            <span id="hitokoto" onClick={authFetchQuote} style={{ cursor: 'pointer' }}>
              <strong style={{ color: '#000000' }}>{quote.text}</strong>
              {quote.from && (
                <div className="has-text-right">
                  — From《{quote.from}》
                </div>
              )}
              {quote.author && (
                <div className="has-text-right">
                  Provider: {quote.author}
                </div>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* CLI ChatBot Entry */}
      <Link
        to="/cli"
        style={{ color: 'inherit', textDecoration: 'none', marginTop: '1rem', marginBottom: '1rem', display: 'block' }}
      >
        <div
          className="card widget"
          style={{
            backgroundColor: '#1a1a1a',
            color: '#fff',
            borderRadius: '8px',
            cursor: 'pointer',
            padding: '0.8rem 1rem',
            fontFamily: "'Cascadia Code', monospace",
          }}
        >
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
            <i className="fas fa-terminal mr-1"></i> CLI ChatBot
          </div>
        </div>
      </Link>

      <LinksCard />
    </div>
    </>
  )
}

export default ProfileCard