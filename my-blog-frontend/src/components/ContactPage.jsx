import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authFetch, getCurrentUser } from '../utils';

function ContactPage() {
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [sent, setSent] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser().then(res => {
      if (res.data?.username) {
        setIsLoggedIn(true);
      } else {
        alert('Please login to send a message.');
        navigate('/login');
      }
    });
  }, []);

  const handleSend = async () => {
    if (!content.trim()) return;

    if (anonymous) {
      const ok = window.confirm('You are sending anonymously. \nYou will NOT be able to see this message and its replies. Continue?');
      if (!ok) return;
    }

    await authFetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content, anonymous })
    });
    setSent(true);
  };

  if (sent) {
    return (
      <section className="section has-navbar-fixed-top">
        <div className="container has-text-centered">
          <h2 className="title is-4">Message sent!</h2>
          <div className="buttons is-centered mt-4">
            <Link to="/" className="button is-light">Home</Link>
            <Link to="/my-messages" className="button is-dark">View My Messages</Link>
          </div>
        </div>
      </section>
    );
  }

  if (!isLoggedIn) return null;

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="level mb-4">
        <div className="level-left">
            <h2 className="title is-4 mb-0">Contact the Admin</h2>
        </div>
        <div className="level-right">
            <div className="buttons has-addons">
            <button
                className={`button is-small ${!anonymous ? 'is-dark' : 'is-light'}`}
                onClick={() => setAnonymous(false)}
            >
                <span className="icon">
                <i className="fas fa-user"></i>
                </span>
                <span>Named</span>
            </button>
            <button
                className={`button is-small ${anonymous ? 'is-dark' : 'is-light'}`}
                onClick={() => setAnonymous(true)}
            >
                <span className="icon">
                <i className="fas fa-user-secret"></i>
                </span>
                <span>Anonymous</span>
            </button>
            </div>
        </div>
        </div>
        <textarea
          className="textarea"
          rows={6}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Your message..."
        />
        <button className="button is-dark mt-3" onClick={handleSend}>Send</button>
      </div>
    </section>
  );
}

export default ContactPage;