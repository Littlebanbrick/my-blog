// src/components/MiddleWidgets.jsx

import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getCurrentUser } from '../utils'

const API_BASE = 'http://localhost:8000'

function MomentList() {
  const [moments, setMoments] = useState([])
  const [loading, setLoading] = useState(true)
  const [likedMap, setLikedMap] = useState({})
  const [commentsMap, setCommentsMap] = useState({})
  const [showAllMap, setShowAllMap] = useState({})
  const location = useLocation()
  const [isLiking, setIsLiking] = useState(false)

  // Delete post (admin right-click)
  const handlePostRightClick = async (e, postId) => {
    e.preventDefault();
    const userRes = await getCurrentUser();
    if (userRes.data?.role !== 'admin') return;

    if (!window.confirm('Confirm to delete this post?')) return;

    try {
      await fetch(`${API_BASE}/api/admin/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      window.location.reload();
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  // Delete comment (admin right-click)
  const handleCommentRightClick = async (e, commentId) => {
    e.preventDefault();
    e.stopPropagation();
    const userRes = await getCurrentUser();
    if (userRes.data?.role !== 'admin') return;

    if (!window.confirm('Confirm to delete this comment?')) return;

    try {
      await fetch(`${API_BASE}/api/admin/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      window.location.reload();
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/api/posts`)
      .then(res => res.json())
      .then(async res => {
        const data = res.data || []
        setMoments(data)

        const statusPromises = data.map(post =>
          fetch(`${API_BASE}/api/posts/${post.id}/like_status`, {
            credentials: 'include'
          })
          .then(res => res.json())
          .then(s => ({ id: post.id, liked: s?.data?.liked || false }))
        )

        const commentPromises = data.map(post =>
          fetch(`${API_BASE}/api/posts/${post.id}/comments`)
          .then(res => res.json())
          .then(c => ({ id: post.id, comments: c.data || c || [] }))
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
      .catch(err => console.error('Failed to fetch posts:', err))
      .finally(() => setLoading(false))
  }, [location.pathname])

  const handleLike = async (e, postId) => {
    e.stopPropagation()
    e.preventDefault()

    if (isLiking) return
    setIsLiking(true)

    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const data = await res.json()
      if (data?.data) {
        setLikedMap(prev => ({ ...prev, [postId]: data.data.liked }))
        setMoments(prev =>
          prev.map(m =>
            m.id === postId ? { ...m, likes_count: data.data.likes_count } : m
          )
        )
      }
    } catch (err) {
      console.error('Like error:', err)
    } finally {
      setIsLiking(false)
    }
  }

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
        const rawComments = commentsMap[item.id]
        const comments = Array.isArray(rawComments) ? rawComments : []
        const showAll = showAllMap[item.id] || false
        const displayedComments = showAll ? comments : comments.slice(0, 5)

        return (
          <Link
            className="card"
            to={`/post/${item.id}`}
            key={item.id}
            style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}
            onContextMenu={(e) => handlePostRightClick(e, item.id)}
          >
            <article className="card-content article" role="article">
              <div className="article-meta size-small is-uppercase level is-mobile">
                <div className="level-left">
                  <i className="fa-regular fa-calendar"></i>
                  <span className="ml-1 mr-2">{item.date}</span>

                  <span
                    className="icon-text is-align-items-center"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => handleLike(e, item.id)}
                  >
                    <i className={`${isLiked ? 'fas' : 'fa-regular'} fa-heart`}
                       style={{ color: isLiked ? '#e0245e' : 'inherit' }}></i>
                    <span className="ml-1">{item.likes_count ?? 0}</span>
                  </span>

                  <span className="commentCountImg ml-3">
                    <i className="fa-regular fa-comment-dots"></i>
                    <span className="ml-1 commentCount">{item.comment_count ?? 0}</span>
                  </span>

                  <span className="level-item ml-3">
                    <i className="fas fa-pencil-alt"></i>
                    <span className="ml-1">{item.word_count ?? 0}</span>
                  </span>
                </div>
              </div>

              <h1 className="title is-3 is-size-4-mobile">{item.title}</h1>
              <div className="content"><p style={{ whiteSpace: 'pre-line' }}>{item.preview}</p></div>

              {item.location && (
                <div className="index-category-tag">
                  <div className="level-item">
                    <i className="fa-solid fa-map-location-dot mr-2"></i>
                    <span className="has-text-grey is-size-7">{item.location}</span>
                  </div>
                </div>
              )}

              {comments.length > 0 && (
                <div className="comments-inline mt-3">
                  {displayedComments.map(comment => (
                    <div 
                      key={comment.id} 
                      className="media" 
                      style={{ borderTop: '1px solid #f0f0f0', paddingTop: '1.4rem' }}
                      onContextMenu={(e) => handleCommentRightClick(e, comment.id)}
                    >
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