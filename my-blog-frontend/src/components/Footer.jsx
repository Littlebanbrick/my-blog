// src/components/Footer.jsx
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="level">
          <div className="level-left">
            <p className="is-size-6 has-text-grey has-text-centered">
              &copy; {new Date().getFullYear()} Johnny Wang. Powered by React &amp; Bulma.
              <br />
              All content licensed under CC BY-NC-SA 4.0.
            </p>
          </div>
          <div className="level-right">
            <a className="button is-small is-text" href="https://github.com/Littlebanbrick/my-blog" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-github mr-1"></i> Source Code
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;