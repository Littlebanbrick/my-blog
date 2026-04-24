import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Temporary logged-in user name (will be replaced by real auth later)
const CURRENT_USER = "anonymous";

function PostPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [likesUsers, setLikesUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');  // only content, no author field

  // Local like state for immediate UI update
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    // Fetch post detail
    fetch(`http://localhost:8000/api/posts/${id}`)
      .then(res => res.json())
      .then(data => {
        setPost(data);
        // Check if current user liked this post
        return fetch(`http://localhost:8000/api/posts/${id}/like_status?user_name=${CURRENT_USER}`);
      })
      .then(res => res.json())
      .then(status => setLiked(status.liked))
      .catch(console.error);

    // Fetch likes (who liked)
    fetch(`http://localhost:8000/api/posts/${id}/likes`)
      .then(res => res.json())
      .then(setLikesUsers)
      .catch(console.error);

    // Fetch comments
    fetch(`http://localhost:8000/api/posts/${id}/comments`)
      .then(res => res.json())
      .then(setComments)
      .catch(console.error);
  }, [id]);

  const handleLike = () => {
    fetch(`http://localhost:8000/api/posts/${id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name: CURRENT_USER })
    })
      .then(res => res.json())
      .then(data => {
        setLiked(data.liked);
        if (post) {
          setPost({ ...post, likes_count: data.likes_count });
        }
        // Refresh likers list
        return fetch(`http://localhost:8000/api/posts/${id}/likes`);
      })
      .then(res => res.json())
      .then(setLikesUsers)
      .catch(console.error);
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    fetch(`http://localhost:8000/api/posts/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: CURRENT_USER, content: newComment })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to submit');
        return res.json();
      })
      .then(() => {
        setNewComment('');
        // 刷新评论列表和帖子数据（获取最新的 comment_count）
        return Promise.all([
          fetch(`http://localhost:8000/api/posts/${id}/comments`),
          fetch(`http://localhost:8000/api/posts/${id}`)
        ]);
      })
      .then(([commentsRes, postRes]) => Promise.all([commentsRes.json(), postRes.json()]))
      .then(([commentsData, postData]) => {
        setComments(commentsData);
        setPost(postData);
      })
      .catch(console.error);
  };

  if (!post) return <div className="section"><div className="container">Loading...</div></div>;

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        {/* Title row with icons */}
        <div className="level is-mobile mb-3">
          <div className="level-left">
            <h1 className="title is-2 mb-0">{post.title}</h1>
          </div>
          <div className="level-right">
            {/* Like button */}
            <span
              className="icon-text is-align-items-center mr-4"
              style={{ cursor: 'pointer' }}
              onClick={handleLike}
            >
              <i className={`${liked ? 'fas' : 'fa-regular'} fa-heart`}
                 style={{ color: liked ? '#e0245e' : 'inherit' }}></i>
              <span className="ml-1">{post.likes_count ?? 0}</span>
            </span>

            {/* Word count */}
            <span className="icon-text is-align-items-center">
              <i className="fas fa-pencil-alt"></i>
              <span className="ml-1">{post.word_count || '0k'}</span>
            </span>
          </div>
        </div>

        <p className="content has-text-grey mb-5 mt-4" style={{ textIndent: '0.3em' }}>{post.date} · {post.location || 'Somewhere'}</p>
        <div className="subtitle" style={{ lineHeight: 2 }} dangerouslySetInnerHTML={{ __html: post.preview }} />
        <hr />

        {/* Liked by */}
        {likesUsers.length > 0 && (
          <p className="has-text-grey mb-5">Liked by: {likesUsers.map(u => u.user_name).join(', ')}</p>
        )}

        {/* Comments */}
        <h3 className="title is-4">Comments ({comments.length})</h3>
        {comments.map(c => (
          <div key={c.id} className="box">
            <strong className="mr-2">{c.author}</strong> <small className="has-text-grey">{c.created_at}</small>
            <p className="mt-1"><i>{c.content}</i></p>
          </div>
        ))}

        {/* Comment input (no name field) */}
        <div className="field">
          <textarea
            className="textarea"
            placeholder="Write a comment..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
          />
        </div>
        <button className="button is-primary" onClick={handleSubmitComment}>Submit</button>
      </div>
    </section>
  );
}

export default PostPage;