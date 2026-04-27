import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getComments, getCurrentUser, addComment } from '../utils';
import DOMPurify from 'dompurify';

const API_BASE = 'http://localhost:8000/api';

function PostPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [likesUsers, setLikesUsers] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/me`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setIsLoggedIn(data.code === 200);
      });

    fetch(`${API_BASE}/posts/${id}`)
      .then(r => r.json())
      .then(res => {
        setPost(res.data || null);
      });

    fetch(`${API_BASE}/posts/${id}/like_status`, {
      credentials: 'include'
    })
    .then(r => r.json())
    .then(res => {
      setIsLiked(res?.data?.liked || false);
    });

    // Get likers
    fetch(`${API_BASE}/posts/${id}/likes`)
      .then(r => r.json())
      .then(res => {
        setLikesUsers(res.data || []);
      });

    getComments(id).then(res => {
      setComments(res.data || res || []);
    });
  }, [id]);

  const handleLike = async () => {
    try {
      const res = await fetch(`${API_BASE}/posts/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (data?.data) {
        setPost({ ...post, likes_count: data.data.likes_count });
        setIsLiked(data.data.liked);
        // Refresh likes users list after like/unlike
        fetch(`${API_BASE}/posts/${id}/likes`)
          .then(r => r.json())
          .then(res => setLikesUsers(res.data || []));
      }
    } catch (error) {
      console.log("Please login to like the post.");
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment) return;

    try {
      await fetch(`${API_BASE}/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: newComment })
      });
      setNewComment("");
      getComments(id).then(res => setComments(res.data || []));
    } catch (error) {
      console.log("Failed to submit comment", error);
    }
  };

  // Delete comment (admin right-click)
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    await fetch(`${API_BASE}/admin/comments/${commentId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    // Reload comments after deletion
    getComments(id).then(res => setComments(res.data || []));
  };

  if (!post) {
    return (
      <div className="section">
        <div className="container">Loading...</div>
      </div>
    );
  }

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="level is-mobile mb-3">
          <div className="level-left">
            <h1 className="title is-2 mb-0">{post.title}</h1>
          </div>
          <div className="level-right">
            <span
              className="icon-text"
              style={{ cursor: 'pointer' }}
              onClick={handleLike}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <i
                  className={isLiked ? 'fas fa-heart' : 'fa-regular fa-heart'}
                  style={{ color: isLiked ? '#e0245e' : 'inherit' }}
                ></i>
                <span className="ml-1">{post.likes_count ?? 0}</span>
              </span>
            </span>
          </div>
        </div>

        <div
          className="content"
          style={{ lineHeight: 2 }}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize((post.preview || "").replace(/\n/g, '<br>'))
          }}
        />

        {/* Liker list */}
        {likesUsers.length > 0 && (
          <div className="mt-3">
            <small className="has-text-grey">Liked by: {likesUsers.map(u => u.user_name).join(', ')}</small>
          </div>
        )}

        <hr />
        <h3 className="title is-4">Comments ({comments.length})</h3>
        {comments.map(c => (
          <div 
            key={c.id} 
            className="box"
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              getCurrentUser().then(res => {
                if (res.data?.role === "admin") handleDeleteComment(c.id);
              });
            }}
          >
            <strong>{c.author}</strong>
            <p className="mt-1" >{c.content}</p>
          </div>
        ))}

        <textarea
          className="textarea"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Write a comment..."
        />
        <button className="button is-dark mt-4" onClick={handleSubmitComment}>
          Submit Comment
        </button>
      </div>
    </section>
  );
}

export default PostPage;