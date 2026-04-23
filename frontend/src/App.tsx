import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Editor from './pages/Editor'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/projects/:projectId" element={<Editor />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
