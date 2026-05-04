// src/App.jsx
import { ThemeProvider } from './context/ThemeContext'
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
import NoteEditor from './components/NoteEditor'
import ProjectEditor from './components/ProjectEditor'
import AboutPage from './components/AboutPage'
import ContactPage from './components/ContactPage'
import MessagesPage from './components/MessagePage'
import MyMessagesPage from './components/MyMessagePage'
import CliChatBot from './components/CliChatBot'
import SongSettings from './components/SongSettings'

import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <ThemeProvider>
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
          <Route path="/study-notes/new" element={<NoteEditor />} />
          <Route path="/study-notes/:id/edit" element={<NoteEditor />} />
          <Route path="/projects/new" element={<ProjectEditor />} />
          <Route path="/projects/:id/edit" element={<ProjectEditor />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin/messages" element={<MessagesPage />} />
          <Route path="/my-messages" element={<MyMessagesPage />} />
          <Route path="/cli" element={<CliChatBot />} />
          <Route path="/admin/song" element={<SongSettings />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;