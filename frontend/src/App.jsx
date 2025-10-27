import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import TeamManagement from './pages/TeamManagement'
import RoomView from './pages/RoomView'
import Shop from './pages/Shop'
import Leaderboard from './pages/Leaderboard'
import AdminPanel from './pages/AdminPanel'
import MainLayout from './components/MainLayout'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) return <div className="loading">Loading...</div>
  if (!user) return <Navigate to="/login" />
  
  return <MainLayout>{children}</MainLayout>
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user || (user.role !== 'admin' && user.role !== 'organiser')) {
    return <Navigate to="/dashboard" />
  }
  
  return <MainLayout>{children}</MainLayout>
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route path="/dashboard" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />
          <Route path="/team" element={
            <PrivateRoute><TeamManagement /></PrivateRoute>
          } />
          <Route path="/room/:roomId" element={
            <PrivateRoute><RoomView /></PrivateRoute>
          } />
          <Route path="/shop" element={
            <PrivateRoute><Shop /></PrivateRoute>
          } />
          <Route path="/leaderboard" element={
            <PrivateRoute><Leaderboard /></PrivateRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute><AdminPanel /></AdminRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
