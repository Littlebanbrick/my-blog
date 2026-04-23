// src/components/Header.jsx

import { useState } from 'react'

function Header() {
  const [isActive, setIsActive] = useState(false)

  return (
    <nav className="navbar is-fixed-top" role="navigation" aria-label="main navigation">
      <div className="container">
        <div className="navbar-brand">
          <a className="navbar-item" href="/">
            <img src="/src/assets/BRICK_ICON.png" alt="Logo" height="28" />
          </a>

          {/* The burger button */}
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
            <a className="navbar-item" href="/">Home</a>
            <a className="navbar-item" href="/categories">Categories</a>
            <a className="navbar-item" href="/about">About</a>
          </div>

          <div className="navbar-end">
            <a className="navbar-item" href="https://github.com/Littlebanbrick" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-github"></i>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Header;