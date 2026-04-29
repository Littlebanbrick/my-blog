import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, setAuthToken, authFetch } from '../utils';

const API_BASE = '/api';

const LoginPage = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    try {
      setLoading(true);
      const res = await authFetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (data.code !== 200) {
        setError(data.msg || "Login failed");
        return;
      }
      
      window.location.href = '/';
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await authFetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ admin_key: adminKey })
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseErr) {
          setError(`Login failed (${response.status}): Invalid response format`);
          return;
        }
        setError(errorData.detail || `Admin login failed (${response.status})`);
        return;
      }

      // 登录成功，后端已设置 httpOnly cookie，前端无需存 token
      window.location.href = '/';
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '120px' }}>
      <div className="columns is-centered">
        <div className="column is-4">
          <div className="card">
            <div className="card-content">
              <h2 className="menu-label mb-3 is-size-4 has-text-centered">
                {isAdminMode ? 'Admin Login' : 'User Login'}
              </h2>

              {!isAdminMode && (
                <div className="mb-4">
                  <div className="field">
                    <label className="label">Username</label>
                    <div className="control">
                      <input
                        className="input"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Password</label>
                    <div className="control">
                      <input
                        className="input"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <button 
                      className="button is-dark is-fullwidth" 
                      onClick={handleLogin}
                      disabled={loading}
                    >
                      {loading ? 'Logging in...' : 'Login'}
                    </button>
                    {error && <p className="has-text-danger has-text-centered mt-2">{error}</p>}
                  </div>
                </div>
              )}

              {isAdminMode && (
                <div className="mb-4">
                  <div className="field">
                    <label className="label">Admin Secret Key</label>
                    <div className="control">
                      <input
                        className="input"
                        type="password"
                        placeholder="Enter admin secret key"
                        value={adminKey}
                        onChange={(e) => setAdminKey(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <button
                      className="button is-fullwidth"
                      style={{ backgroundColor: '#8B0000', color: 'white' }}
                      onClick={handleAdminLogin}
                      disabled={loading}
                    >
                      Admin Login
                    </button>
                    {error && <p className="has-text-danger has-text-centered mt-2">{error}</p>}
                  </div>
                </div>
              )}

              <div className="is-flex is-justify-content-space-between is-size-7">
                <button
                  className="button is-text is-small has-text-grey"
                  onClick={() => {
                    setIsAdminMode(!isAdminMode);
                    setError('');
                  }}
                >
                  {isAdminMode ? 'Back to User Login' : 'Admin Login? Click here'}
                </button>

                {!isAdminMode && (
                  <a href="/register" className="button is-text is-small has-text-grey">
                    Create Account
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;