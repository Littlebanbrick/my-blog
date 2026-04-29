import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils';

const API_BASE = '/api';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Get user profile on component mount
  useEffect(() => {
    authFetch(`${API_BASE}/user/profile`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.code === 200) setUser(data.data);
        else navigate('/login');
      });
  }, [navigate]);

  // Delete account handler
  const handleDeleteAccount = async () => {
    if (!window.confirm('Confirm to delete your account? All data will be lost!')) return;
    
    const res = await authFetch(`${API_BASE}/user/delete`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await res.json();
    if (data.code === 200) {
      alert('Account deleted successfully');
      navigate('/');
      window.location.reload();
    }
  };

  if (!user) return <div className="section">Loading...</div>;

  return (
    <section className="section has-navbar-fixed-top">
      <div className="container">
        <div className="columns is-centered">
          <div className="column is-4">
            <div className="card">
              <div className="card-content">
                <h2 className="title is-4 has-text-centered">My Profile</h2>
                <p className="mb-2"><strong>Username:</strong> {user.username}</p>
                <p className="mb-2"><strong>Email:</strong> {user.email}</p>
                <p className="mb-2"><strong>Role:</strong> {user.role}</p>
                <hr/>
                <button 
                  className="button is-fullwidth mt-4"
                  style={{ backgroundColor: '#8B0000', color: 'white' }}
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;