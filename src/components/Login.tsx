import { useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { getApiUrl } from '../config/api'

interface LoginProps {
  onLogin: (userId: string, username: string) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      setIsLoading(true)
      try {
        // Generate user ID from username
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // Create initial profile
        try {
          await axios.post(getApiUrl(`api/users/${userId}/profile`), {
            username: username.trim()
          })
        } catch (error) {
          console.error('Error creating profile:', error)
          // Continue anyway
        }
        
        onLogin(userId, username.trim())
      } catch (error) {
        console.error('Login error:', error)
        alert('Có lỗi xảy ra khi đăng nhập')
      } finally {
        setIsLoading(false)
      }
    }
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên của bạn
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên của bạn..."
              className="cute-input w-full"
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLoading || !username.trim()}
            className="w-full cute-button bg-gradient-to-r from-cute-pink to-cute-lavender text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang kết nối...' : 'Bắt đầu 🚀'}
          </motion.button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>✨ Theme: Modern & Cute</p>
        </div>
      </motion.div>
    </div>
  )
}
