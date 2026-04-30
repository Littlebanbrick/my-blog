import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    await authFetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content, anonymous })
    });
    setSent(true);
  };

  if (sent) return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <h2 className="title is-4">Message sent! Thank you.</h2>
        <button className="button is-light" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    </section>
  );

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