import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authFetch, getCurrentUser } from '../utils'

function Header() {
  const [isActive, setIsActive] = useState(false)
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    // 之前的做法：从 localStorage 获取 token —— 改为请求后端获取当前用户
    let mounted = true;
    getCurrentUser()
      .then((res) => {
        if (!mounted) return;
        if (res && res.data && res.data.username) {
          setUser(res.data);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
    return () => { mounted = false; };
  }, []);

  const handleLogout = async () => {
    // 调用后端 /api/logout 清除 cookie
    try {
      await authFetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      // 忽略错误，仍清本地状态
      console.error('logout error', err);
    } finally {
      setUser(null);
      localStorage.removeItem('token'); // 如果你手动存了 token，也一起删掉
      window.location.href = '/'; // 刷新页面，触发 Header 重新获取用户信息
    }
  };

  return (
    <nav className="navbar is-fixed-top" role="navigation" aria-label="main navigation">
      <div className="container">
        <div className="navbar-brand">
          <Link className="navbar-item" to="/">
            <img src="/BRICK_ICON.png" alt="Logo" height="28" />
          </Link>

          <a
            role="button"
            className={`navbar-burger ${isActive ? 'is-active' : ''}`}
            aria-label="menu"
            aria-expanded="false"
            onClick={() => setIsActive(!isActive)}
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>

        <div className={`navbar-menu ${isActive ? 'is-active' : ''}`}>
          <div className="navbar-start">
            <Link className="navbar-item" to="/">
              Home
            </Link>
            <Link className="navbar-item" to="/archives">
              Archives
            </Link>
            <Link className="navbar-item" to="/about">
              About
            </Link>
            <Link className="navbar-item" to="https://github.com/Littlebanbrick" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-github mt-1"></i>
            </Link>
            <Link className="navbar-item" to="https://space.bilibili.com/3546895630731348?spm_id_from=333.1007.0.0" target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-bilibili mt-1"></i>
            </Link>
            <Link className="navbar-item" to="https://x.com/JohnnyWang5784" target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-x-twitter mt-1"></i>
            </Link>
          </div>

          <div className="navbar-end">
            {!user ? (
              <div className="navbar-item">
                <div className="buttons">
                  <Link to="/register" className="button is-light is-small">Register</Link>
                  <Link to="/login" className="button is-dark is-small">Login</Link>
                </div>
              </div>
            ) : (
              <div className="navbar-item">
                <div className="buttons">
                  {user.role === 'admin' && (
                    <Link to="/create-post" className="button is-dark is-small">Create Post</Link>
                  )}
                  <Link to="/profile" className="button is-light is-small">{user.username}</Link>
                  <button className="button is-dark is-small" onClick={handleLogout}>Logout</button>
                </div>
              </div>
            )}
        </div>
      </div>
      </div>
    </nav>
  );
};

export default Header