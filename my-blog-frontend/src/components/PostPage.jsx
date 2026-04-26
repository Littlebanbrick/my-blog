import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toggleLike, getComments, addComment } from '../utils';

function PostPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetch(`http://localhost:8000/api/posts/${id}`)
      .then(r => r.json())
      .then(d => setPost(d.data || d));

    getComments(id).then(setComments);
  }, [id]);

  const handleLike = async () => {
    try {
      const res = await toggleLike(id);
      if(res?.data) {
        setPost({...post, likes_count: res.data.likes_count });
      }
    } catch (error) {
      console.log("Please login to like the post.");
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment) return;
    await addComment(id, newComment);
    setNewComment('');
    getComments(id).then(setComments);
  };

  if (!post) return <div className="section"><div className="container">Loading...</div></div>;

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
              <i className="fa-regular fa-heart"></i>
              <span className="ml-1">{post.likes_count ?? 0}</span>
            </span>
          </div>
        </div>

        <div className="content" style={{ lineHeight: 2 }} dangerouslySetInnerHTML={{ __html: post.preview }} />

        <hr />
        <h3 className="title is-4">Comments ({comments.length})</h3>
        {comments.map(c => (
          <div key={c.id} className="box">
            <strong>{c.author}</strong>
            <p className="mt-1">{c.content}</p>
          </div>
        ))}

        <textarea
          className="textarea"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
        />
        <button className="button is-dark mt-2" onClick={handleSubmitComment}>
          Submit Comment
        </button>
      </div>
    </section>
  );
}

export default PostPage;