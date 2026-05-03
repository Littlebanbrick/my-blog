import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getComments, getCurrentUser, addComment, getImageUrl, authFetch } from '../utils';
import DOMPurify from 'dompurify';
import Lightbox from './LightBox';

const API_BASE = '/api';

function PostPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [likesUsers, setLikesUsers] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    authFetch(`${API_BASE}/me`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setIsLoggedIn(data.code === 200));

    authFetch(`${API_BASE}/posts/${id}`)
      .then(r => r.json())
      .then(res => setPost(res.data || null));

    authFetch(`${API_BASE}/posts/${id}/like_status`, { credentials: 'include' })
      .then(r => r.json())
      .then(res => setIsLiked(res?.data?.liked || false));

    authFetch(`${API_BASE}/posts/${id}/likes`)
      .then(r => r.json())
      .then(res => setLikesUsers(res.data || []));

    getComments(id).then(res => setComments(res.data || res || []));
  }, [id]);

  const handleLike = async () => {
    const userRes = await getCurrentUser();
    if (!userRes?.data?.username) {
      alert('Please login to like the post.');
      return;
    }

    try {
      const res = await authFetch(`/api/posts/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (data?.data) {
        setPost({ ...post, likes_count: data.data.likes_count });
        setIsLiked(data.data.liked);
        authFetch(`/api/posts/${id}/likes`)
          .then(r => r.json())
          .then(res => setLikesUsers(res.data || []));
      }
    } catch (error) {
      console.log("Please login to like the post.");
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    const userRes = await getCurrentUser();
    if (!userRes?.data?.username) {
      alert('Please login to comment.');
      return;
    }

    const body = { content: newComment };
    if (replyTo) body.parent_id = replyTo.id;

    try {
      await authFetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });
      setNewComment("");
      setReplyTo(null);
      getComments(id).then(res => setComments(res.data || []));
    } catch (error) {
      console.log("Failed to submit comment", error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    await authFetch(`${API_BASE}/admin/comments/${commentId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    getComments(id).then(res => setComments(res.data || []));
  };

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () => {
    if (!post?.images?.length) return;
    setLightboxIndex(prev => (prev === 0 ? post.images.length - 1 : prev - 1));
  };
  const nextImage = () => {
    if (!post?.images?.length) return;
    setLightboxIndex(prev => (prev === post.images.length - 1 ? 0 : prev + 1));
  };

  if (!post) {
    return (
      <div className="section">
        <div className="container">Loading...</div>
      </div>
    );
  }

  const validImages = (post.images || []).filter(url => url && url.trim() !== '');

  return (
    <>
      <section className="section has-navbar-fixed-top">
        <div className="container">
          <div className="level is-mobile mb-3">
            <div className="level-left">
              <h1 className="title is-2 mb-0">{post.title}</h1>
            </div>
            <div className="level-right">
              <span className="icon-text" style={{ cursor: 'pointer' }} onClick={handleLike}>
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
            style={{ lineHeight: 2, fontSize: '1.1rem' }}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize((post.preview || "").replace(/\n/g, '<br>'))
            }}
          />

          {/* Images display area */}
          {validImages.length > 0 && (
            <div className="mt-3" style={{ textAlign: 'left' }}>
              {validImages.length === 1 ? (
                <figure className="image" style={{ maxWidth: '100%', cursor: 'pointer' }} onClick={() => openLightbox(0)}>
                  <img
                    src={getImageUrl(validImages[0])}
                    alt="post image"
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                  />
                </figure>
              ) : (
                <div className="columns is-multiline is-mobile">
                  {validImages.map((url, idx) => (
                    <div key={idx} className="column is-4">
                      <figure className="image is-3by2" onClick={() => openLightbox(idx)} style={{ cursor: 'pointer' }}>
                        <img
                          src={getImageUrl(url)}
                          alt={`post-img-${idx}`}
                          style={{ objectFit: 'cover' }}
                        />
                      </figure>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Like list */}
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
              style={{
                marginLeft: c.parent_id ? '2rem' : '0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                getCurrentUser().then(res => {
                  if (res.data?.role === "admin") handleDeleteComment(c.id);
                });
              }}
            >
              <div style={{ flex: 1 }}>
                <strong>{c.author}</strong>
                {c.parent_author && (
                  <span className="has-text-grey is-size-7"> reply to <strong>{c.parent_author}</strong></span>
                )}
                <small className="has-text-grey ml-2">{c.created_at}</small>
                <p className="mt-1">{c.content}</p>
              </div>
              {isLoggedIn && (
                <button
                  className="button is-text is-small is-dark"
                  style={{ flexShrink: 0 }}
                  onClick={() => setReplyTo({ id: c.id, author: c.author })}
                >
                  Reply
                </button>
              )}
            </div>
          ))}

          {replyTo && (
            <div
              className="notification is-light is-info is-small"
              style={{
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Replying to <strong>{replyTo.author}</strong></span>
              <button
                className="delete is-small"
                style={{ verticalAlign: 'middle', marginTop: 0 }}
                onClick={() => setReplyTo(null)}
              />
            </div>
          )}
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

      {/* Lightbox */}
      {lightboxIndex !== null && validImages.length > 0 && (
        <Lightbox
          images={validImages.map(url => getImageUrl(url))}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </>
  );
}

export default PostPage;