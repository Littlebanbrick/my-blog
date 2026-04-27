// src/App.jsx
import HomePage from './components/HomePage'
import PostPage from './components/PostPage'
import Header from './components/Header'
import Footer from './components/Footer'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import VerifyEmail from './components/VerifyEmail'
import WaitVerification from './components/WaitVerification'
import ProfilePage from './components/ProfilePage'
import CreatePostPage from './components/CreatePostPage'
import ArchivesPage from './components/ArchivesPage'
import PhotographyPage from './components/PhotographyPage'
import StudyNotesPage from './components/StudyNotesPage'
import NotePage from './components/NotePage'
import ProjectsPage from './components/ProjectsPage'

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
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/create-post" element={<CreatePostPage />} />
        <Route path="/archives" element={<ArchivesPage />} />
        <Route path="/photography" element={<PhotographyPage />} />
        <Route path="/study-notes" element={<StudyNotesPage />} />
        <Route path="/study-notes/:id" element={<NotePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;