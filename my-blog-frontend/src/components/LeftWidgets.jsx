// src/components/LeftWidgets.jsx
import { useState, useEffect } from 'react'
import myAvatar from '../assets/myAvatar.jpg' // Placeholder avatar image

function ProfileCard() {
  // Data for profile cards
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // State for hitokoto (dynamic quote)
  const [quote, setQuote] = useState({ text: 'Loading...', from: '', author: '' })

  useEffect(() => {
    fetch('http://localhost:8000/api/profile')
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

  const fetchQuote = async () => {
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
    fetchQuote()
  }, [])

  
  if (loading) {
    return <div className="card"><div className="card-content">Loading profile...</div></div>;
  }

  return (
    <div className="card widget" data-type="profile">
      <div className="card-content">
        {/* Avatar and basic info */}
        <nav className="level">
          <div className="level-item has-text-centered flex-shrink-1">
            <div>
              <figure className="image is-128x128 mx-auto mb-2">
                <img className="avatar is-rounded" src={profile.avatar} alt="avatar" />
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
            <a href="/likes/">
                <p className="title">{profile.likes}</p>
            </a>
            </div>
        </div>
        <div className="level-item has-text-centered is-marginless">
            <div style={{ minWidth: '60px' }}>
            <p className="heading">Comments</p>
            <a href="/comments/">
                <p className="title">{profile.comments}</p>
            </a>
            </div>
        </div>
        </nav>

        {/* Hitokoto section (click to refresh) */}
        <div>
          <hr />
          <span id="hitokoto" onClick={fetchQuote} style={{ cursor: 'pointer' }}>
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
  )
}

export default ProfileCard