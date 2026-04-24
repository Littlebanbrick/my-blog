import ProfileCard from './LeftWidgets';
import MomentList from './MomentList';
import RightWidgets from './RightWidgets';

function HomePage() {
  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="columns">
          <div className="column is-3">
            <ProfileCard />
          </div>
          <div className="column is-6">
            <MomentList />
          </div>
          <div className="column is-3">
            <RightWidgets />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomePage;