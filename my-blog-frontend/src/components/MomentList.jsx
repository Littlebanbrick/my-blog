// src/components/MomentList.jsx

import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const USER_NAME = "anonymous"  // temporary, until login system is ready

function MomentList() {
  const [moments, setMoments] = useState([])
  const [loading, setLoading] = useState(true)
  const [likedMap, setLikedMap] = useState({})         // { [postId]: boolean }
  const [commentsMap, setCommentsMap] = useState({})   // { [postId]: array }
  const [showAllMap, setShowAllMap] = useState({})     // { [postId]: boolean }
  const location = useLocation()
  const [isLiking, setIsLiking] = useState(false) // Avoid multiple rapid likes

  useEffect(() => {
    setLoading(true)
    fetch('http://localhost:8000/api/posts')
      .then(res => res.json())
      .then(async data => {
        setMoments(data)

        // Fetch like status and comments for each post
        const statusPromises = data.map(post =>
          fetch(`http://localhost:8000/api/posts/${post.id}/like_status?user_name=${USER_NAME}`)
            .then(res => res.json())
            .then(s => ({ id: post.id, liked: s.liked }))
        )
        const commentPromises = data.map(post =>
          fetch(`http://localhost:8000/api/posts/${post.id}/comments`)
            .then(res => res.json())
            .then(c => ({ id: post.id, comments: c }))
        )

        const statuses = await Promise.all(statusPromises)
        const newLiked = {}
        statuses.forEach(s => { newLiked[s.id] = s.liked })
        setLikedMap(newLiked)

        const commentResults = await Promise.all(commentPromises)
        const newComments = {}
        commentResults.forEach(r => { newComments[r.id] = r.comments })
        setCommentsMap(newComments)
      })
      .catch(err => {
        console.error('Failed to fetch posts:', err)
      })
      .finally(() => setLoading(false))
  }, [location.pathname])

  const handleLike = (e, postId) => {
    e.stopPropagation()
    e.preventDefault()

    if(isLiking) return; // Prevent multiple rapid clicks
    setIsLiking(true);  // Set liking state to prevent multiple clicks

    fetch(`http://localhost:8000/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: USER_NAME })
    })
      .then(res => res.json())
      .then(data => {
        // Update local like status
        setLikedMap(prev => ({ ...prev, [postId]: data.liked }))
        // Update likes_count in moments
        setMoments(prev => prev.map(m => 
          m.id === postId ? { ...m, likes_count: data.likes_count } : m
        ))
      })
      .catch(console.error)
      .finally(() => setIsLiking(false)); // Reset liking state
  };

  const toggleShowAll = (e, postId) => {
    e.stopPropagation()
    e.preventDefault()
    setShowAllMap(prev => ({ ...prev, [postId]: !prev[postId] }))
  }

  if (loading) {
    return <div className="card"><div className="card-content">Loading moments...</div></div>
  }

  return (
    <>
      {moments.map((item) => {
        const isLiked = likedMap[item.id] || false
        const rawComments = commentsMap[item.id];
        const comments = Array.isArray(rawComments) ? rawComments : [];
        const showAll = showAllMap[item.id] || false
        const displayedComments = showAll ? comments : comments.slice(0, 5)

        return (
          <Link
            className="card"
            to={`/post/${item.id}`}
            key={item.id}
            style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}
          >
            <article className="card-content article" role="article">
              {/* Meta info: date, likes, comments, read time */}
              <div className="article-meta size-small is-uppercase level is-mobile">
                <div className="level-left">
                  <i className="fa-regular fa-calendar"></i>
                  <span className="ml-1 mr-2">{item.date}</span>

                  {/* Like button & count – stop propagation to prevent navigation */}
                  <span
                    className="icon-text is-align-items-center"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => handleLike(e, item.id)}
                  >
                    <i className={`${isLiked ? 'fas' : 'fa-regular'} fa-heart`}
                       style={{ color: isLiked ? '#e0245e' : 'inherit' }}></i>
                    <span className="ml-1">{item.likes_count}</span>
                  </span>

                  {/* Comment icon & count – clicking it is fine to navigate (no stopPropagation) */}
                  <span className="commentCountImg ml-3">
                    <i className="fa-regular fa-comment-dots"></i>
                    <span className="ml-1 commentCount">{item.comment_count}</span>
                  </span>

                  <span className="level-item ml-3">
                    <i className="fas fa-pencil-alt"></i>
                    <span className="ml-1">{item.word_count}</span>
                  </span>
                </div>
              </div>

              {/* Title – just text, no inner Link (already wrapped) */}
              <h1 className="title is-3 is-size-4-mobile">
                {item.title}
              </h1>

              {/* Content preview */}
              <div className="content">
                <p>{item.preview}</p>
              </div>

              {/* Location (optional) */}
              {item.location && (
                <div className="index-category-tag">
                  <div className="level-item">
                    <i className="fa-solid fa-map-location-dot mr-2"></i>
                    <span className="has-text-grey is-size-7">{item.location}</span>
                  </div>
                </div>
              )}

              {/* Inline comments section */}
              {comments.length > 0 && (
                <div className="comments-inline mt-3">
                  {displayedComments.map(comment => (
                    <div key={comment.id} className="media" style={{ borderTop: '1px solid #f0f0f0', paddingTop: '1.4rem' }}>
                      <div className="media-content">
                        <strong className="mr-2">{comment.author}:</strong>
                        <span><i>{comment.content}</i></span>
                      </div>
                    </div>
                  ))}

                  {comments.length > 5 && (
                    <button
                      className="button is-text is-small"
                      onClick={(e) => toggleShowAll(e, item.id)}
                    >
                      {showAll ? 'Show less comments' : `Show all ${comments.length} comments`}
                    </button>
                  )}
                </div>
              )}
            </article>
          </Link>
        )
      })}
    </>
  )
}

export default MomentList