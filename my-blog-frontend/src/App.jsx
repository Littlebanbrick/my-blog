// src/App.jsx
import ProfileCard from './components/LeftWidgets'
import MomentList from './components/MomentList'
import RightWidgets from './components/RightWidgets'
import Header from './components/Header'
import Footer from './components/Footer'

function App() {
  return (
    <>
      <Header />

      <div className="main-content">
        <section className="section" style={{ paddingTop: '5rem'}}>
          <div className="container">
            <div className="columns">
              {/* Left column: Profile */}
              <div className="column is-3">
                <ProfileCard />
              </div>

              {/* Middle column: Moments */}
              <div className="column is-6">
                <MomentList />
              </div>

              {/* Right column: Photos, Notes, Projects */}
              <div className="column is-3">
                <RightWidgets />
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}

export default App;