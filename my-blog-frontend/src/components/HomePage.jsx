import ProfileCard from "./LeftWidgets";
import MomentList from "./MiddleWidgets";
import RightWidgets from "./RightWidgets";

function HomePage() {
  return (
    <div
      className="main-content"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <style>{`
        /* 关键修复：强制所有父容器不创建滚动上下文 */
        .section,
        .container,
        .columns,
        .column {
          overflow: visible !important;
        }

        /* 桌面端 sticky 侧边栏（内容过高时独立滚动，不溢出到 footer） */
        .sticky-sidebar {
        position: sticky;
        top: 1rem;
        align-self: start;
        max-height: calc(100vh - 2rem);
        overflow-y: auto !important;
        scrollbar-width: none; /* Firefox 隐藏滚动条 */
        -ms-overflow-style: none; /* IE/Edge 隐藏滚动条 */
        }
        
        .sticky-sidebar::-webkit-scrollbar {
        display: none; /* Chrome/Safari 隐藏滚动条 */
        }

        /* 当屏幕宽度小于 1024px 时，彻底禁用 sticky 并让列垂直堆叠 */
        @media (max-width: 1023px) {
          .sticky-sidebar {
            position: static !important;
            top: auto !important;
            max-height: none !important;
            overflow-y: visible !important;
          }
          .columns {
            flex-direction: column !important;
          }
          .column {
            width: 100% !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
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
    </div>
  );
}

export default HomePage;
