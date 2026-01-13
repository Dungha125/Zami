import { motion } from 'framer-motion'
import { 
  ChatBubbleLeftRightIcon, 
  VideoCameraIcon,
  MusicalNoteIcon,
  FilmIcon,
  MapPinIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { getApiUrl } from '../config/api'

interface SidebarProps {
  username: string
  userId: string
  onChatClick: () => void
  onVideoCallClick: () => void
  onMusicClick: () => void
  onMovieClick: () => void
  onProfileClick: () => void
  onAddFriendClick: () => void
}

export default function Sidebar({ 
  username, 
  userId,
  onChatClick, 
  onVideoCallClick, 
  onMusicClick, 
  onMovieClick,
  onProfileClick,
  onAddFriendClick
}: SidebarProps) {
  const [avatar, setAvatar] = useState<string | null>(null)

  useEffect(() => {
    loadAvatar()
  }, [userId])

  const loadAvatar = async () => {
    try {
      const response = await axios.get(getApiUrl(`api/users/${userId}/profile`))
      if (response.data.avatar) {
        setAvatar(response.data.avatar)
      }
    } catch (error) {
      console.error('Error loading avatar:', error)
    }
  }

  return (
    <motion.div
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      className="w-20 bg-white/90 backdrop-blur-md shadow-xl flex flex-col items-center py-6 space-y-4 z-10"
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onProfileClick}
        className="flex flex-col items-center mb-4 cursor-pointer group"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cute-pink to-cute-lavender flex items-center justify-center text-white font-bold text-lg mb-2 border-2 border-transparent group-hover:border-cute-pink transition-colors overflow-hidden">
          {avatar ? (
            <img src={avatar} alt={username} className="w-full h-full object-cover" />
          ) : (
            username.charAt(0).toUpperCase()
          )}
        </div>
        <div className="text-xs font-medium text-gray-600 truncate max-w-[60px] group-hover:text-cute-pink transition-colors">
          {username}
        </div>
      </motion.button>

      <div className="flex-1 flex flex-col space-y-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onAddFriendClick}
          className="p-3 rounded-2xl bg-green-200/40 hover:bg-green-300/60 transition-colors group"
          title="Thêm bạn bè"
        >
          <UserPlusIcon className="w-6 h-6 text-green-600 group-hover:text-green-700" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onChatClick}
          className="p-3 rounded-2xl bg-cute-pink/20 hover:bg-cute-pink/40 transition-colors group"
          title="Chat"
        >
          <ChatBubbleLeftRightIcon className="w-6 h-6 text-cute-pink group-hover:text-pink-600" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onVideoCallClick}
          className="p-3 rounded-2xl bg-blue-200/40 hover:bg-blue-300/60 transition-colors group"
          title="Video Call"
        >
          <VideoCameraIcon className="w-6 h-6 text-blue-600 group-hover:text-blue-700" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onMusicClick}
          className="p-3 rounded-2xl bg-purple-200/40 hover:bg-purple-300/60 transition-colors group"
          title="Nghe nhạc cùng nhau"
        >
          <MusicalNoteIcon className="w-6 h-6 text-purple-600 group-hover:text-purple-700" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onMovieClick}
          className="p-3 rounded-2xl bg-red-200/40 hover:bg-red-300/60 transition-colors group"
          title="Xem phim cùng nhau"
        >
          <FilmIcon className="w-6 h-6 text-red-600 group-hover:text-red-700" />
        </motion.button>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <MapPinIcon className="w-6 h-6 text-gray-400" />
      </div>
    </motion.div>
  )
}
