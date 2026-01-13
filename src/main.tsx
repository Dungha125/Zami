import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.tsx'
import './index.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "347974923411-2ln342c2j6kcv5nc9sngpbqn97suhqhs.apps.googleusercontent.com"

if (!GOOGLE_CLIENT_ID) {
  console.error('VITE_GOOGLE_CLIENT_ID is not set. Please configure it in your .env file.')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
