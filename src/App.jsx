import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Rules from './pages/Rules'
import Dashboard from './pages/Dashboard'
import TeamManagement from './pages/TeamManagement'
import RoomView from './pages/RoomView'
import Shop from './pages/Shop'
import Leaderboard from './pages/Leaderboard'
import AdminPanel from './pages/AdminPanel'
import MainLayout from './components/MainLayout'

function PrivateRoute({ children }) {
  const { user, userId, loading } = useAuth()
  
  if (loading) return <div className="loading">Loading...</div>
  
  // If no userId in localStorage, redirect to login immediately
  if (!userId) return <Navigate to="/login" replace />
  
  // If userId exists but user data hasn't loaded yet, show loading
  if (!user) return <div className="loading">Loading...</div>
  
  return <MainLayout>{children}</MainLayout>
}

function AdminRoute({ children }) {
  const { user, userId, loading } = useAuth()
  
  if (loading) return <div className="loading">Loading...</div>
  
  // If no userId in localStorage, redirect to login immediately
  if (!userId) return <Navigate to="/login" replace />
  
  // If userId exists but user data hasn't loaded yet, show loading
  if (!user) return <div className="loading">Loading...</div>
  
  // Check admin/organiser role
  if (user.role !== 'admin' && user.role !== 'organiser') {
    return <Navigate to="/dashboard" replace />
  }
  
  return <MainLayout>{children}</MainLayout>
}

function PublicRoute({ children }) {
  const { userId, loading } = useAuth()
  
  if (loading) return <div className="loading">Loading...</div>
  
  // If already logged in, redirect to dashboard
  if (userId) return <Navigate to="/dashboard" replace />
  
  return children
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={
            <PublicRoute><Login /></PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute><Signup /></PublicRoute>
          } />
          
          <Route path="/onboarding" element={
            <PrivateRoute><Onboarding /></PrivateRoute>
          } />
          <Route path="/rules" element={
            <PrivateRoute><Rules /></PrivateRoute>
          } />
          
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
