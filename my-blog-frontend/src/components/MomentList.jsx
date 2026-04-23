// src/components/MomentList.jsx

function MomentList() {
  // Mock data for moments (like blog posts)
  const moments = [
    {
      id: 1,
      date: '2026-04-24',
      title: 'Discovered an amazing album',
      preview: 'Love this kind of grand narrative music. It never gets old...',
      location: 'Hangzhou, China',
      commentCount: 12,
      likes: '9',
      wordCount: '0.1k'
    },
    {
      id: 2,
      date: '2026-04-05',
      title: 'Feeling nostalgic',
      preview: 'Remember playing Flash games on 4399 back in elementary school...',
      location: '',
      commentCount: 8,
      likes: '15',
      wordCount: '0.7k'
    },
    {
      id: 3,
      date: '2026-03-20',
      title: 'Recent Arcaea sessions',
      preview: 'Arcaea updated new BYD charts. Took me a while to climb...',
      location: 'Shenzhen, China',
      commentCount: 5,
      likes: '10',
      wordCount: '0.5k'
    }
  ];

  return (
    <>
      {moments.map((item) => (
        <div className="card" key={item.id}>
          <article className="card-content article" role="article">
            {/* Meta info: date, comments, read time */}
            <div className="article-meta size-small is-uppercase level is-mobile">
              <div className="level-left">
                <i class="fa-regular fa-calendar"></i>
                <span className="ml-1 mr-2">{item.date}</span>

                <a href={`/moment/${item.id}#comments`} className="commentCountImg">
                  <i class="fa-regular fa-comment-dots"></i>
                  <span className="ml-1 commentCount">{item.commentCount}</span>
                </a>

                <span className="level-item ml-3">
                  <i class="fa-regular fa-heart"></i>
                  <span className="ml-1">{item.likes}</span>
                </span>
                <span className="level-item ml-3">
                  <i className="fas fa-pencil-alt"></i>
                  <span className="ml-1">{item.wordCount}</span>
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="title is-3 is-size-4-mobile">
              <a className="link-muted" href={`/moment/${item.id}`}>
                {item.title}
              </a>
            </h1>

            {/* Content preview */}
            <div className="content">
              <p>{item.preview}</p>
            </div>

            {/* Location (optional, only if location is provided) */}
            {item.location && (
            <div className="index-category-tag">
                <div className="level-item">
                <i class="fa-solid fa-map-location-dot mr-2"></i>
                <span className="has-text-grey is-size-7">{item.location}</span>
                </div>
            </div>
            )}
          </article>
        </div>
      ))}
    </>
  );
}

export default MomentList;