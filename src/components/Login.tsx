import { useState } from 'react'
import { motion } from 'framer-motion'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import axios from 'axios'
import { getApiUrl } from '../config/api'

interface LoginProps {
  onLogin: (userId: string, username: string) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      alert('Không nhận được thông tin đăng nhập từ Google')
      return
    }

    setIsLoading(true)
    try {
      // Send the credential (ID token) to backend for verification
      const response = await axios.post(getApiUrl('api/auth/google'), {
        token: credentialResponse.credential
      })
      
      const { user_id, username } = response.data
      onLogin(user_id, username)
    } catch (error: any) {
      console.error('Google login error:', error)
      alert(error.response?.data?.detail || 'Có lỗi xảy ra khi đăng nhập với Google')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleError = () => {
    alert('Đăng nhập Google thất bại. Vui lòng thử lại.')
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cute-card p-8 w-full max-w-md"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cute-pink to-cute-lavender bg-clip-text text-transparent mb-2">
            🗺️ Jagat Clone
          </h1>
          <p className="text-gray-600">Kết nối với bạn bè, chia sẻ vị trí real-time</p>
        </motion.div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="w-full cute-button bg-white text-gray-700 border-2 border-gray-300 flex items-center justify-center gap-3 cursor-not-allowed">
              <div className="w-5 h-5 border-2 border-cute-pink border-t-transparent rounded-full animate-spin"></div>
              <span>Đang đăng nhập...</span>
            </div>
          ) : (
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                locale="vi"
              />
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>✨ Đăng nhập an toàn với Google</p>
        </div>
      </motion.div>
    </div>
  )
}
