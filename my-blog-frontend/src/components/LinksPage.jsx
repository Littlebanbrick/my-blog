// src/components/LinksPage.jsx
import { useEffect, useState, useRef } from "react";

function LinksPage() {
  const [profile, setProfile] = useState(null);
  const [friendGroups, setFriendGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // 修改为 Johnny Wang 的 profile
      const profileData = {
        avatar: "/myAvatar.jpg",
        name: "Johnny Wang",
        bio: "A freshman majoring in CS from Zhejiang Univ. - Curious, consistent, and always building",
      };
      setProfile(profileData);

      // 修改为 Johnny Wang 的 groups
      const groups = [
        {
          id: 1,
          title: "Friends",
          description: "My best buddies in tech and life.",
          links: [
            {
              name: "Augrottos",
              avatar: "https://avatars.githubusercontent.com/u/268848168?v=4",
              url: "https://github.com/Augrottos",
              description: "Elahz izob tuia suiee.",
            },
            {
              name: "Hubery",
              avatar: "https://s41.ax1x.com/2026/03/14/peEfnTx.jpg",
              url: "https://blog.ramenboy.cc/",
              description: "千早爱音的狗",
            },
          ],
        },
        {
          id: 2,
          title: "Study Partners",
          description: "People who inspire me to learn more.",
          links: [],
        },
      ];
      setFriendGroups(groups);
      setLoading(false);
    };
    fetchData();
  }, []);

  // 跑马灯组件：只增加空白，其他逻辑保持不变
  const MarqueeText = ({ text }) => {
    const containerRef = useRef(null);
    const [needsScroll, setNeedsScroll] = useState(false);

    useEffect(() => {
      const check = () => {
        if (containerRef.current) {
          setNeedsScroll(containerRef.current.scrollWidth > containerRef.current.clientWidth);
        }
      };
      check();
      window.addEventListener("resize", check);
      return () => window.removeEventListener("resize", check);
    }, [text]);

    return (
      <div
        ref={containerRef}
        className={`marquee-container ${needsScroll ? "needs-scroll" : ""}`}
        style={{
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        <div className="marquee-content" style={{ display: "inline-block" }}>
          <span>{text}</span>
          <span style={{ display: "inline-block", width: "2rem" }}>&nbsp;</span>
          {needsScroll && (
            <>
              <span>{text}</span>
              <span style={{ display: "inline-block", width: "2rem" }}>&nbsp;</span>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="section">Loading...</div>;
  }

  return (
    <div style={{ marginTop: "2rem" }}>
      <section className="section">
        <div className="container">
          <h1 className="title is-2">Friends & Links</h1>

          {profile && (
            <div className="card mb-5">
              <div className="card-content">
                <div className="media" style={{ alignItems: "center" }}>
                  <div className="media-left">
                    <figure className="image is-96x96">
                      <img src={profile.avatar} alt="Avatar" className="is-rounded" />
                    </figure>
                  </div>
                  <div className="media-content" style={{ minWidth: 0 }}>
                    <p className="title is-4" style={{ marginBottom: "0.25rem" }}>
                      {profile.name}
                    </p>
                    <p className="subtitle is-6" style={{ marginTop: "0.05rem" }}>
                      {profile.bio}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {friendGroups.filter(g => g.links.length > 0).map((group) => (
            <div key={group.id} className="card mb-5">
              <div className="card-content">
                <h2 className="title is-4 has-text-dark" style={{ marginBottom: "0.5rem" }}>
                  {group.title}
                </h2>
                {group.description && (
                  <p className="mb-2" style={{ marginBottom: "0.75rem" }}>
                    {group.description}
                  </p>
                )}
                <div className="columns is-multiline mt-2">
                  {group.links.map((link, idx) => (
                    <div key={idx} className="column is-4">
                      <div className="card">
                        <div className="card-content">
                          <div className="media">
                            <div className="media-left">
                              <figure className="image is-48x48">
                                <img src={link.avatar} alt={link.name} className="is-rounded" />
                              </figure>
                            </div>
                            <div className="media-content" style={{ minWidth: 0 }}>
                              <p className="title is-6" style={{ marginBottom: "0.05rem" }}>
                                <a href={link.url} target="_blank" rel="noopener noreferrer">
                                  <MarqueeText text={link.name} />
                                </a>
                              </p>
                              {link.description && (
                                <p className="is-size-7" style={{ marginTop: 0 }}>
                                  <MarqueeText text={link.description} />
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .marquee-container {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          line-height: 1.6;
          padding-bottom: 2px;
        }
        .marquee-container .marquee-content {
          display: inline-block;
          white-space: nowrap;
        }
        .marquee-container.needs-scroll:hover .marquee-content {
          animation: marquee 8s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-container.needs-scroll .marquee-clone {
          display: inline-block;
          padding-left: 2rem;
        }
        .marquee-container:not(.needs-scroll) .marquee-clone {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default LinksPage;