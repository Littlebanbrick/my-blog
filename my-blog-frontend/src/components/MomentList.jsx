// src/components/MomentList.jsx

import { useState, useEffect } from 'react'

function MomentList() {
  // Data for moments (like blog posts)
  const [moments, setMoments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:8000/api/posts')
      .then(res => res.json())
      .then(data => {
        setMoments(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch posts:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="card"><div className="card-content">Loading moments...</div></div>;
  }

  return (
    <>
      {moments.map((item) => (
        <div className="card" key={item.id}>
          <article className="card-content article" role="article">
            {/* Meta info: date, comments, read time */}
            <div className="article-meta size-small is-uppercase level is-mobile">
              <div className="level-left">
                <i className="fa-regular fa-calendar"></i>
                <span className="ml-1 mr-2">{item.date}</span>

                <a href={`/moment/${item.id}#comments`} className="commentCountImg">
                  <i className="fa-regular fa-comment-dots"></i>
                  <span className="ml-1 commentCount">{item.commentCount}</span>
                </a>

                <span className="level-item ml-3">
                  <i className="fa-regular fa-heart"></i>
                  <span className="ml-1">{item.likes}</span>
                </span>
                <span className="level-item ml-3">
                  <i className="fas fa-pencil-alt"></i>
                  <span className="ml-1">{item.wordCount}</span>
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="title is-3 is-size-4-mobile">
              <a className="link-muted" href={`/moment/${item.id}`}>
                {item.title}
              </a>
            </h1>

            {/* Content preview */}
            <div className="content">
              <p>{item.preview}</p>
            </div>

            {/* Location (optional, only if location is provided) */}
            {item.location && (
            <div className="index-category-tag">
                <div className="level-item">
                <i className="fa-solid fa-map-location-dot mr-2"></i>
                <span className="has-text-grey is-size-7">{item.location}</span>
                </div>
            </div>
            )}
          </article>
        </div>
      ))}
    </>
  );
}

export default MomentList;