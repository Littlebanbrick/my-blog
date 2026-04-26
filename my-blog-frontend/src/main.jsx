import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { getAuthToken, isTokenExpired, logout } from './utils';

// 全局token过期拦截
function AuthWrapper({ children }) {
  useEffect(() => {
    const token = getAuthToken();
    if (token && isTokenExpired(token)) {
      logout();
    }
  }, []);
  return children;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthWrapper>
      <App />
    </AuthWrapper>
  </StrictMode>,
);
