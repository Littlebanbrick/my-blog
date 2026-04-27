import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../utils'

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
      await fetch('http://localhost:8000/api/logout', {
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
            <img src="/src/assets/BRICK_ICON.png" alt="Logo" height="28" />
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
            <Link className="navbar-item" to="/categories">
              Categories
            </Link>
            <Link className="navbar-item" to="/about">
              About
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
            <Link className="navbar-item" to="https://github.com/Littlebanbrick" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-github"></i>
            </Link>
        </div>
      </div>
      </div>
    </nav>
  );
};

export default Header