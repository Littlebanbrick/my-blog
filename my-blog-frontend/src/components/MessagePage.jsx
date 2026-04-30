import { useState, useEffect } from 'react';
import { authFetch } from '../utils';

function MessagesPage() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    authFetch('/api/admin/messages')
      .then(res => res.json())
      .then(res => setMessages(res.data || []));
  }, []);

  const markRead = async (id) => {
    await authFetch(`/api/admin/messages/${id}/read`, { method: 'PUT' });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: 1 } : m));
  };

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <h2 className="title is-4">Inbox</h2>
        {messages.map(msg => (
          <div key={msg.id} className="box" style={{ background: msg.is_read ? '#f5f5f5' : '#fff' }}>
            <p><strong>{msg.sender_username}</strong> · {msg.created_at}</p>
            <p>{msg.content}</p>
            {!msg.is_read && <button className="button is-small is-light" onClick={() => markRead(msg.id)}>Mark as Read</button>}
          </div>
        ))}
      </div>
    </section>
  );
}
export default MessagesPage;