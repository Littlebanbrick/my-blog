// src/components/Friends.jsx
import { getImageUrl } from '../utils';

const friends = [
  {
    name: "Augrottos",
    avatar: "https://avatars.githubusercontent.com/u/268848168?v=4",            // 本地或远程头像
    desc: "SYSU最忧郁之人",
    url: "https://github.com/Augrottos",
  },
  {
    name: "Hubery's notebook",
    avatar: "https://s41.ax1x.com/2026/03/14/peEfnTx.jpg",
    desc: "《千早爱音》的狗",
    url: "https://hubery258.github.io/",
  },
  // 添加更多友链...
];

function Friends() {
  if (!friends.length) return null;

  return (
    <div className="card widget">
      <div className="card-content">
        <h3 className="menu-label mb-3">
          <i className="fas fa-link mr-2"></i>Friends
        </h3>
        {friends.map((friend, idx) => (
          <article className="media" key={idx}>
            <figure className="media-left">
              <p className="image is-32x32">
                <img
                  className="is-rounded"
                  src={getImageUrl(friend.avatar)}
                  alt={friend.name}
                  style={{ objectFit: 'cover' }}
                />
              </p>
            </figure>
            <div className="media-content">
              <p className="title is-6 mt-1 mb-0">
                <a
                  href={friend.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {friend.name}
                </a>
              </p>
              <p className="subtitle is-7 has-text-grey mt-1">
                {friend.desc}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default Friends;