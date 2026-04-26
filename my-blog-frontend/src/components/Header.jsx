import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'


function Header() {
  const [isActive, setIsActive] = useState(false)
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setUser(token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
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
                  <button className="button is-light is-small" disabled>Logged in</button>
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