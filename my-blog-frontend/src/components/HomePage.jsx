import ProfileCard from './LeftWidgets';
import MomentList from './MiddleWidgets';
import RightWidgets from './RightWidgets';

function HomePage() {
  return (
    <>
      <style>{`
        /* 关键修复：强制所有父容器不创建滚动上下文 */
        .section,
        .container,
        .columns,
        .column {
          overflow: visible !important;
        }

        /* 桌面端 sticky 侧边栏 */
        .sticky-sidebar {
          position: sticky;
          top: 1rem;
          align-self: start;
          overflow: visible !important;
        }

        /* 当屏幕宽度小于 1024px 时，彻底禁用 sticky 并让列垂直堆叠 */
        @media (max-width: 1023px) {
          .sticky-sidebar {
            position: static !important;
            top: auto !important;
          }
          .columns {
            flex-direction: column;
          }
          .column {
            width: 100% !important;
          }
        }
      `}</style>

      <section className="section has-navbar-fixed-top">
        <div className="container">
          <div className="columns">
            <div className="column is-3 sticky-sidebar pt-3">
              <ProfileCard />
            </div>
            <div className="column is-6 pt-3">
              <MomentList />
            </div>
            <div className="column is-3 sticky-sidebar pt-3">
              <RightWidgets />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
export default HomePage;