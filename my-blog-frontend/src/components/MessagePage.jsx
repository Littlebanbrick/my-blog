// src/components/MessagesPage.jsx
import { useState, useEffect, useRef } from "react";
import { authFetch } from "../utils";

const ADMIN_NAME = "小BAN砖";

function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [activeRootId, setActiveRootId] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [quoteMsg, setQuoteMsg] = useState(null); // 引用消息
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    const res = await authFetch("/api/admin/messages");
    const data = await res.json();
    if (data.code === 200) setMessages(data.data);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    const onFocus = () => {
      fetchMessages();
      window.refreshUnread && window.refreshUnread();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const loadConversation = async (rootId) => {
    const res = await authFetch(`/api/messages/${rootId}/conversation`);
    const data = await res.json();
    if (data.code === 200) setConversation(data.data);
  };

  const handleSelectRoot = async (msg) => {
    setActiveRootId(msg.id);
    loadConversation(msg.id);
    await authFetch(`/api/admin/messages/${msg.id}/read`, { method: "PUT" });
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id ? { ...m, is_read: 1, unread_replies: 0 } : m,
      ),
    );
    window.refreshUnread && window.refreshUnread();
    setQuoteMsg(null); // 切换对话时取消引用
  };

  const handleAdminReply = async () => {
    if (!replyText.trim() || !activeRootId) return;
    await authFetch(`/api/admin/messages/${activeRootId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        content: replyText,
        quoted_id: quoteMsg?.id || null,
      }),
    });
    setReplyText("");
    setQuoteMsg(null);
    loadConversation(activeRootId);
    window.refreshUnread && window.refreshUnread();
  };

  const handleDeleteMessage = async (e, msgId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Delete this message and its replies?")) return;
    await authFetch(`/api/admin/messages/${msgId}`, { method: "DELETE" });
    if (activeRootId === msgId) {
      setActiveRootId(null);
      setConversation([]);
    }
    fetchMessages();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="columns">
          {/* 左侧：根消息列表 */}
          <div className="column is-4">
            <h2 className="title is-4 mb-3">Inbox</h2>
            <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {messages.length === 0 && (
                <p className="has-text-grey">No messages.</p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`card mb-2 ${msg.id === activeRootId ? "has-background-light" : ""}`}
                  onClick={() => handleSelectRoot(msg)}
                  onContextMenu={(e) => handleDeleteMessage(e, msg.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="card-content" style={{ padding: "0.75rem" }}>
                    <p className="is-size-7 has-text-weight-semibold">
                      {msg.sender_username}
                      {!msg.is_read && (
                        <span className="tag is-danger is-small ml-2">New</span>
                      )}
                      {msg.unread_replies > 0 && (
                        <span className="tag is-warning is-small ml-1">
                          {msg.unread_replies} new reply
                        </span>
                      )}
                    </p>
                    <p className="is-size-7 has-text-grey mt-1">
                      {msg.content?.substring(0, 80)}
                    </p>
                    <p className="is-size-7 has-text-grey-light mt-1">
                      {msg.created_at}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧：对话界面 */}
          <div className="column is-8">
            {activeRootId ? (
              <>
                <div
                  className="box"
                  style={{
                    minHeight: "55vh",
                    maxHeight: "65vh",
                    overflowY: "auto",
                  }}
                >
                  {conversation.map((msg) => (
                    <div
                      key={msg.id}
                      className="mb-3"
                      style={{
                        textAlign:
                          msg.sender_username === ADMIN_NAME ? "right" : "left",
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (quoteMsg && quoteMsg.id === msg.id) {
                          setQuoteMsg(null); // 取消引用
                        } else {
                          setQuoteMsg({ id: msg.id, content: msg.content });
                        }
                      }}
                    >
                      <div
                        style={{
                          display: "inline-block",
                          maxWidth: "80%",
                          padding: "8px 14px",
                          borderRadius: "12px",
                          background:
                            msg.sender_username === ADMIN_NAME
                              ? "#f5f5f5"
                              : "#3273dc",
                          color:
                            msg.sender_username === ADMIN_NAME
                              ? "#333"
                              : "#fff",
                          textAlign: "left",
                        }}
                      >
                        <p className="is-size-7 has-text-weight-bold">
                          {msg.sender_username}
                        </p>
                        {msg.quoted_content && (
                          <div
                            style={{
                              marginBottom: "6px",
                              borderTop: "1px solid #ccc",
                              paddingTop: "4px",
                            }}
                          >
                            {msg.sender_username === ADMIN_NAME ? (
                              <p
                                className="is-size-7 has-text-grey"
                                style={{ fontStyle: "italic" }}
                              >
                                {msg.quoted_content?.length > 100
                                  ? msg.quoted_content.substring(0, 100) + "..."
                                  : msg.quoted_content}
                              </p>
                            ) : (
                              <p
                                className="is-size-7 has-text-white"
                                style={{ fontStyle: "italic" }}
                              >
                                {msg.quoted_content?.length > 100
                                  ? msg.quoted_content.substring(0, 100) + "..."
                                  : msg.quoted_content}
                              </p>
                            )}
                          </div>
                        )}
                        <p>{msg.content}</p>
                        <p className="is-size-7" style={{ opacity: 0.8 }}>
                          {msg.created_at}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                {/* 引用提示 */}
                {quoteMsg && (
                  <div
                    className="notification is-light is-info is-small"
                    style={{
                      padding: "0.5rem 1rem",
                      marginBottom: "0.5rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>
                      Replying to:{" "}
                      <em>
                        {quoteMsg.content?.substring(0, 60)}
                        {quoteMsg.content?.length > 60 ? "..." : ""}
                      </em>
                    </span>
                    <button
                      className="delete is-small"
                      onClick={() => setQuoteMsg(null)}
                    ></button>
                  </div>
                )}
                <div className="field has-addons mt-2">
                  <div className="control is-expanded">
                    <input
                      className="input"
                      type="text"
                      placeholder={
                        quoteMsg ? "Reply with quote..." : "Reply..."
                      }
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleAdminReply()
                      }
                    />
                  </div>
                  <div className="control">
                    <button
                      className="button is-dark"
                      onClick={handleAdminReply}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div
                className="box has-text-centered"
                style={{
                  minHeight: "55vh",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p className="has-text-grey">Select a conversation to view</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default MessagesPage;
