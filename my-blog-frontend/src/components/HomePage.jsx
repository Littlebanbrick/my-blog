import ProfileCard from './LeftWidgets';
import MomentList from './MiddleWidgets';
import RightWidgets from './RightWidgets';
import { toggleLike } from '../utils';

function HomePage() {
  const handleLike = async (postId, index) => {
    try {
      const res = await toggleLike(postId);
      if (res?.data) {
        const newPosts = [...posts];
        newPosts[index].likes_count = res.data.likes_count;
        setPosts(newPosts);
      }
    } catch (err) {
      console.log("Please log in first");
    }
  };

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="columns">
          <div className="column is-3 sticky-sidebar pt-2">
            <ProfileCard />
          </div>
          <div className="column is-6 pt-3">
            <MomentList onLike={handleLike} />
          </div>
          <div className="column is-3 sticky-sidebar pt-2">
            <RightWidgets />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomePage;