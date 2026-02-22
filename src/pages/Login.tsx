import React from 'react'
import { Auth } from '../components/Auth'
import { useAuth } from '../contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'

const Login: React.FC = () => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If user is already logged in, redirect to home or intended page
  if (user) {
    const from = location.state?.from?.pathname ||
      sessionStorage.getItem('redirect_after_login') ||
      '/';

    // Clear the session storage if we used it
    if (sessionStorage.getItem('redirect_after_login')) {
      sessionStorage.removeItem('redirect_after_login');
    }

    return <Navigate to={from} replace />
  }

  return (
    <Layout>
      <Auth />
    </Layout>
  )
}

export default Login
