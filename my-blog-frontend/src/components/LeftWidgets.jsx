// src/components/LeftWidgets.jsx
import { useState, useEffect } from 'react'
import myAvatar from '../assets/myAvatar.jpg' // Placeholder avatar image
import { authFetch } from '../utils';

const API_BASE = 'http://localhost:8000'

function ProfileCard() {
  // Data for profile cards
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rotation, setRotation] = useState(0)
  // State for hitokoto (dynamic quote)
  const [quote, setQuote] = useState({ text: 'Loading...', from: '', author: '' })

  useEffect(() => {
    authFetch(`${API_BASE}/api/profile`)
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
      const res = await authFetch('https://v1.hitokoto.cn/')
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

  function LinksCard() {
    return (
      <div className="card widget">
        <div className="card-content">
          <h3 className="menu-label mb-2">
            <i className="fas fa-link mr-2"></i>LINKS
          </h3>
          <ul className="menu-list">
            <li>
              <a href="https://zh-hans.react.dev/" target="_blank" rel="noopener" className="level is-mobile">
                <span className="level-left mb-1" style={{ flex: 1, wordBreak: 'break-word' }}>
                  React Docs
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
                  >zh-hans.react.dev</span>
                </span>
              </a>
            </li>
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
          </ul>
        </div>
      </div>
    );
  }

  useEffect(() => {
    authFetchQuote()
  }, [])

  
  if (loading) {
    return <div className="card"><div className="card-content">Loading profile...</div></div>;
  }

  return (
    <>
    <div className="card widget" data-type="profile">
      <div className="card-content">
        {/* Avatar and basic info */}
        <nav className="level">
          <div className="level-item has-text-centered flex-shrink-1">
            <div>
              <figure className="image is-128x128 mx-auto mb-2">
                <img
                  className="avatar is-rounded"
                  src={profile.avatar || '/default-avatar.png'}
                  alt="avatar"
                  onClick={handleAvatarClick}
                  style={{ cursor: 'pointer', transition: 'transform 0.8s ease', transform: `rotate(${rotation}deg)` }}
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
    < LinksCard />
    </>
  )
}

export default ProfileCard