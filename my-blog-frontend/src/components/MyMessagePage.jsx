// src/components/MyMessagesPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authFetch, getCurrentUser } from '../utils';

function MyMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [activeRootId, setActiveRootId] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser().then(res => {
      if (res.data?.username) setUser(res.data);
      else navigate('/login');
    });
  }, [navigate]);

  const fetchMessages = async () => {
    const res = await authFetch('/api/messages/my');
    const data = await res.json();
    if (data.code === 200) setMessages(data.data);
  };

  useEffect(() => { if (user) fetchMessages(); }, [user]);

  useEffect(() => {
    const onFocus = () => fetchMessages();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const loadConversation = async (rootId) => {
    const res = await authFetch(`/api/messages/${rootId}/conversation`);
    const data = await res.json();
    if (data.code === 200) setConversation(data.data);
  };

  const handleSelectRoot = async (msg) => {
    setActiveRootId(msg.id);
    loadConversation(msg.id);
    await authFetch(`/api/messages/${msg.id}/read`, { method: 'PUT' });
    setMessages(prev =>
        prev.map(m => m.id === msg.id ? { ...m, unread_replies: 0 } : m)
    );
    window.refreshUnread && window.refreshUnread();
  };

  const handleUserReply = async () => {
    if (!replyText.trim() || !activeRootId) return;
    await authFetch(`/api/messages/${activeRootId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: replyText })
    });
    setReplyText('');
    loadConversation(activeRootId);
    window.refreshUnread && window.refreshUnread();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  if (!user) return <section className="section"><div className="container">Loading...</div></section>;

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="columns">
          {/* 左侧：我的根消息 */}
          <div className="column is-4">
            <h2 className="title is-4 mb-3">My Messages</h2>
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {messages.length === 0 && <p className="has-text-grey">No messages yet.</p>}
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`card mb-2 ${msg.id === activeRootId ? 'has-background-light' : ''}`}
                  onClick={() => handleSelectRoot(msg)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-content" style={{ padding: '0.75rem' }}>
                    <p className="is-size-7 has-text-weight-semibold">
                      To Admin
                      {msg.unread_replies > 0 && (
                        <span className="tag is-warning is-small ml-1">
                          {msg.unread_replies} new reply
                        </span>
                      )}
                    </p>
                    <p className="is-size-7 has-text-grey mt-1">{msg.content?.substring(0, 80)}</p>
                    <p className="is-size-7 has-text-grey-light mt-1">{msg.created_at}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧：对话界面 */}
          <div className="column is-8">
            {activeRootId ? (
              <>
                <div className="box" style={{ minHeight: '55vh', maxHeight: '65vh', overflowY: 'auto' }}>
                  {conversation.map(msg => (
                    <div
                      key={msg.id}
                      className="mb-3"
                      style={{ textAlign: msg.sender_username === user.username ? 'right' : 'left' }}
                    >
                      <div
                        style={{
                          display: 'inline-block',
                          maxWidth: '80%',
                          padding: '8px 14px',
                          borderRadius: '12px',
                          background: msg.sender_username === user.username ? '#3273dc' : '#f5f5f5',
                          color: msg.sender_username === user.username ? '#fff' : '#333',
                          textAlign: 'left'
                        }}
                      >
                        <p className="is-size-7 has-text-weight-bold">{msg.sender_username}</p>
                        <p>{msg.content}</p>
                        <p className="is-size-7" style={{ opacity: 0.8 }}>{msg.created_at}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="field has-addons mt-2">
                  <div className="control is-expanded">
                    <input
                      className="input"
                      type="text"
                      placeholder="Reply..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleUserReply()}
                    />
                  </div>
                  <div className="control">
                    <button className="button is-dark" onClick={handleUserReply}>Send</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="box has-text-centered" style={{ minHeight: '55vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="has-text-grey">Select a conversation to view</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default MyMessagesPage;