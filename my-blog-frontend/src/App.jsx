// src/App.jsx
import HomePage from './components/HomePage'
import PostPage from './components/PostPage'
import Header from './components/Header'
import Footer from './components/Footer'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import VerifyEmail from './components/VerifyEmail'
import WaitVerification from './components/WaitVerification'

import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/post/:id" element={<PostPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/wait-verification" element={<WaitVerification />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;