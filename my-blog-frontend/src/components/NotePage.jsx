import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { getCurrentUser, authFetch } from "../utils";

const API_BASE = "/api";

function NotePage() {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    authFetch(`${API_BASE}/notes/${id}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.code === 200) setNote(res.data);
      })
      .catch(console.error);

    getCurrentUser().then((res) => {
      if (res.data?.role === "admin") setIsAdmin(true);
    });
  }, [id]);

  if (!note)
    return (
      <section className="section">
        <div className="container">Loading...</div>
      </section>
    );

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="level">
          <div className="level-left">
            <Link to="/study-notes" className="button is-light is-small">
              &larr; Back
            </Link>
          </div>
          {isAdmin && (
            <div className="level-right">
              <Link
                to={`/study-notes/${id}/edit`}
                className="button is-dark is-small"
              >
                Edit
              </Link>
            </div>
          )}
        </div>
        <div
          className="content markdown-body note-body"
          style={{
            maxWidth: "85%",
            marginLeft: "auto",
            marginRight: "auto",
            backgroundColor: "#ffffff",
            padding: "2rem 2.5rem",
            borderRadius: "6px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {note.content}
          </ReactMarkdown>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .note-body {
            max-width: 100% !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding: 1rem 1rem !important;
            border-radius: 0 !important;        /* 去圆角，更贴近边缘 */
            box-shadow: none !important;         /* 去除阴影，减少视觉干扰 */
          }
        }
      `}</style>
    </section>
  );
}

export default NotePage;
