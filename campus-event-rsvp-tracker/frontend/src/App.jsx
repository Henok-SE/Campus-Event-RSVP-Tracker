import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/Home'  // Changed from './pages/HomePage' to match your file

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Add more routes as you build */}
        <Route path="/events" element={<div>Events Page</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/register" element={<div>Register Page</div>} />
      </Routes>
    </Router>
  )
}

export default App