import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { getCurrentUser } from './utils';

// 全局token过期拦截
function AuthWrapper({ children }) {
  useEffect(() => {
    getCurrentUser().catch(() => {
      console.log("Token expired or not logged in");
      localStorage.removeItem('token'); // 清除过期 token
    });
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
