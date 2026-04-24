// src/App.jsx
import HomePage from './components/HomePage'
import PostPage from './components/PostPage'
import Header from './components/Header'
import Footer from './components/Footer'

import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/post/:id" element={<PostPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;