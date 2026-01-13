import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { XMarkIcon, CameraIcon, CheckIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import { getApiUrl } from '../config/api'

interface ProfileProps {
  userId: string
  onClose: () => void
}

interface UserProfile {
  username: string
  avatar: string | null
  bio: string
  status: string
}

export default function Profile({ userId, onClose }: ProfileProps) {
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    avatar: null,
    bio: '',
    status: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    try {
      const response = await axios.get(getApiUrl(`api/users/${userId}/profile`))
      setProfile({
        username: response.data.username || '',
        avatar: response.data.avatar || null,
        bio: response.data.bio || '',
        status: response.data.status || ''
      })
      if (response.data.avatar) {
        setAvatarPreview(response.data.avatar)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setAvatarPreview(base64String)
        setProfile(prev => ({ ...prev, avatar: base64String }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await axios.post(getApiUrl(`api/users/${userId}/profile`), {
        username: profile.username,
        avatar: profile.avatar,
        bio: profile.bio,
        status: profile.status
      })
      setIsEditing(false)
      await loadProfile()
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Có lỗi xảy ra khi lưu thông tin')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="cute-card w-96 max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md"
    >
      <div className="p-4 border-b-2 border-cute-pink/20 flex items-center justify-between sticky top-0 bg-white/95 z-10">
        <h2 className="text-xl font-bold text-cute-pink">👤 Hồ sơ</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-cute-pink/20 rounded-full transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-cute-pink to-cute-lavender flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-xl">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile.username.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            {isEditing && (
              <label className="absolute bottom-0 right-0 p-2 bg-cute-pink rounded-full cursor-pointer hover:bg-pink-500 transition-colors shadow-lg">
                <CameraIcon className="w-5 h-5 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên người dùng
          </label>
          {isEditing ? (
            <input
              type="text"
              value={profile.username}
              onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
              className="cute-input w-full"
              placeholder="Nhập tên của bạn"
            />
          ) : (
            <div className="px-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent">
              <p className="font-semibold text-gray-800">{profile.username}</p>
            </div>
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giới thiệu
          </label>
          {isEditing ? (
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
              className="cute-input w-full min-h-[100px] resize-none"
              placeholder="Giới thiệu về bản thân..."
            />
          ) : (
            <div className="px-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent min-h-[100px]">
              <p className="text-gray-700 whitespace-pre-wrap">
                {profile.bio || 'Chưa có thông tin giới thiệu'}
              </p>
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trạng thái
          </label>
          {isEditing ? (
            <input
              type="text"
              value={profile.status}
              onChange={(e) => setProfile(prev => ({ ...prev, status: e.target.value }))}
              className="cute-input w-full"
              placeholder="VD: Đang đi chơi, Đang làm việc..."
            />
          ) : (
            <div className="px-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent">
              <p className="text-gray-700">{profile.status || 'Chưa có trạng thái'}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {isEditing ? (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsEditing(false)
                  loadProfile()
                }}
                className="flex-1 px-4 py-3 rounded-2xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-colors"
                disabled={isSaving}
              >
                Hủy
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={isSaving || !profile.username.trim()}
                className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-cute-pink to-cute-lavender text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  'Đang lưu...'
                ) : (
                  <>
                    <CheckIcon className="w-5 h-5" />
                    Lưu
                  </>
                )}
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-cute-pink to-cute-lavender text-white font-semibold transition-colors"
            >
              Chỉnh sửa hồ sơ
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
