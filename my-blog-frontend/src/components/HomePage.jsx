import ProfileCard from './LeftWidgets';
import MomentList from './MiddleWidgets';
import RightWidgets from './RightWidgets';

function HomePage() {
  return (
    <>
      {/* 修复滚动冲突 + 移动端禁用 sticky */}
      <style>{`
        /* 强制所有祖先容器不创建滚动上下文 */
        .section,
        .container,
        .columns,
        .column {
          overflow: visible !important;
        }

        /* 电脑端 sticky 侧边栏正常工作 */
        .sticky-sidebar {
          position: sticky;
          top: 1rem;
          align-self: start;
          overflow: visible !important;
        }

        /* 移动端（< 769px）禁用 sticky，避免覆盖 */
        @media (max-width: 768px) {
          .sticky-sidebar {
            position: static !important;
            top: auto !important;
          }
        }
      `}</style>

      <section className="section has-navbar-fixed-top">
        <div className="container">
          <div className="columns">
            <div className="column is-3 sticky-sidebar pt-2">
              <ProfileCard />
            </div>
            <div className="column is-6 pt-3">
              <MomentList />
            </div>
            <div className="column is-3 sticky-sidebar pt-2">
              <RightWidgets />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default HomePage;