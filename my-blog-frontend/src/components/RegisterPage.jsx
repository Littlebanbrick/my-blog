import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../utils';

const RegisterPage = () => {
  // 仅声明一次状态变量
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError('');
    // 简单表单验证
    if (!username || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    try {
      const res = await registerUser(username, email, password);

      if(res.code === 200) {
        localStorage.setItem('verify_username', username);
        window.location.href = '/wait-verification';
      } else {
        setError(res.msg);
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '120px' }}>
      <div className="columns is-centered">
        <div className="column is-4">
          <div className="card">
            <div className="card-content">
              <h2 className="menu-label mb-3 is-size-4 has-text-centered">
                Create Account
              </h2>

              <div className="field">
                <label className="label">Username</label>
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label className="label">Email</label>
                <div className="control">
                  <input
                    className="input"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label className="label">Password</label>
                <div className="control">
                  <input
                    className="input"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-3">
                <button 
                  className="button is-dark is-fullwidth" 
                  onClick={handleRegister}
                >
                  Register
                </button>
                {error && <p className="has-text-danger has-text-centered mt-2">{error}</p>}
              </div>

              <div className="has-text-centered mt-4 is-size-7">
                <a href="/login" className="has-text-grey-dark">
                  Already have an account? Login
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;