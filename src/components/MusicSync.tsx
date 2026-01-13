import { useState } from 'react'
import { motion } from 'framer-motion'
import { XMarkIcon, PlayIcon, PauseIcon, MusicalNoteIcon } from '@heroicons/react/24/outline'

interface MusicSyncProps {
  userId: string
  onClose: () => void
}

export default function MusicSync({ userId, onClose }: MusicSyncProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<string | null>(null)

  // Placeholder for music synchronization
  // In production, this would sync playback across all users using WebSocket
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
    // Sync with other users via WebSocket
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="cute-card w-80 bg-white/95 backdrop-blur-md"
    >
      <div className="p-4 border-b-2 border-cute-pink/20 flex items-center justify-between">
        <h2 className="text-xl font-bold text-cute-pink flex items-center gap-2">
          <MusicalNoteIcon className="w-6 h-6" />
          Nghe nhạc cùng nhau
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-cute-pink/20 rounded-full transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="aspect-square bg-gradient-to-br from-cute-pink to-cute-lavender rounded-3xl flex items-center justify-center">
          <MusicalNoteIcon className="w-24 h-24 text-white/80" />
        </div>

        <div className="text-center">
          <h3 className="font-bold text-lg text-gray-800 mb-1">
            {currentTrack || 'Chưa chọn bài hát'}
          </h3>
          <p className="text-sm text-gray-500">Đang đồng bộ với bạn bè...</p>
        </div>

        <div className="flex justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePlayPause}
            className="p-4 rounded-full bg-gradient-to-r from-cute-pink to-cute-lavender text-white"
          >
            {isPlaying ? (
              <PauseIcon className="w-8 h-8" />
            ) : (
              <PlayIcon className="w-8 h-8" />
            )}
          </motion.button>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>✨ Tính năng đang phát triển</p>
          <p className="text-xs mt-1">Sẽ hỗ trợ YouTube, Spotify...</p>
        </div>
      </div>
    </motion.div>
  )
}
