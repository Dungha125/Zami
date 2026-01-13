import { motion } from 'framer-motion'
import { 
  ChatBubbleLeftRightIcon, 
  VideoCameraIcon,
  MusicalNoteIcon,
  FilmIcon,
  MapPinIcon,
  UserPlusIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'

interface BottomNavbarProps {
  onChatClick: () => void
  onVideoCallClick: () => void
  onMusicClick: () => void
  onMovieClick: () => void
  onProfileClick: () => void
  onAddFriendClick: () => void
  onMapClick: () => void
  currentView: 'map' | 'chat' | 'video' | 'music' | 'movie' | 'profile' | 'addFriend'
}

export default function BottomNavbar({
  onChatClick,
  onVideoCallClick,
  onMusicClick,
  onMovieClick,
  onProfileClick,
  onAddFriendClick,
  onMapClick,
  currentView
}: BottomNavbarProps) {
  const isActive = (view: string) => currentView === view

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-2xl border-t-2 border-cute-pink/20 z-50"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {/* Map Button - Always visible to go back */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onMapClick}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-colors ${
            isActive('map') 
              ? 'bg-cute-pink/30 text-cute-pink' 
              : 'text-gray-600 hover:bg-gray-100/50'
          }`}
        >
          <MapPinIcon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Bản đồ</span>
        </motion.button>

        {/* Add Friend */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onAddFriendClick}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-colors ${
            isActive('addFriend') 
              ? 'bg-green-200/50 text-green-600' 
              : 'text-gray-600 hover:bg-gray-100/50'
          }`}
        >
          <UserPlusIcon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Thêm bạn</span>
        </motion.button>

        {/* Chat */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onChatClick}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-colors ${
            isActive('chat') 
              ? 'bg-cute-pink/30 text-cute-pink' 
              : 'text-gray-600 hover:bg-gray-100/50'
          }`}
        >
          <ChatBubbleLeftRightIcon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Chat</span>
        </motion.button>

        {/* Video Call */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onVideoCallClick}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-colors ${
            isActive('video') 
              ? 'bg-blue-200/50 text-blue-600' 
              : 'text-gray-600 hover:bg-gray-100/50'
          }`}
        >
          <VideoCameraIcon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Video</span>
        </motion.button>

        {/* Profile */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onProfileClick}
          className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-colors ${
            isActive('profile') 
              ? 'bg-cute-pink/30 text-cute-pink' 
              : 'text-gray-600 hover:bg-gray-100/50'
          }`}
        >
          <UserCircleIcon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Tài khoản</span>
        </motion.button>
      </div>
    </motion.div>
  )
}
