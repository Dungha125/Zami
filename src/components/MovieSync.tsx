import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { XMarkIcon, FilmIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline'

interface MovieSyncProps {
  userId: string
  onClose: () => void
}

export default function MovieSync({ userId, onClose }: MovieSyncProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      setIsScreenSharing(true)
      setIsPlaying(true)
      
      // Handle stop sharing
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare()
      }
    } catch (error) {
      console.error('Error sharing screen:', error)
      alert('Không thể chia sẻ màn hình. Vui lòng thử lại.')
    }
  }

  const stopScreenShare = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScreenSharing(false)
    setIsPlaying(false)
  }

  useEffect(() => {
    return () => {
      stopScreenShare()
    }
  }, [])

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <div className="w-full h-full bg-black/95 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-black/80 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FilmIcon className="w-6 h-6" />
          Xem phim cùng nhau
        </h2>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
        >
          <XMarkIcon className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex items-center justify-center relative">
        {!isScreenSharing ? (
          <div className="text-center space-y-4">
            <FilmIcon className="w-24 h-24 text-white/50 mx-auto" />
            <p className="text-white/70 text-lg">Chưa có video được chia sẻ</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startScreenShare}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-semibold"
            >
              Chia sẻ màn hình
            </motion.button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/80 flex items-center justify-center gap-4">
        {isScreenSharing && (
          <>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePlayPause}
              className="p-4 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              {isPlaying ? (
                <PauseIcon className="w-8 h-8" />
              ) : (
                <PlayIcon className="w-8 h-8" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={stopScreenShare}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-colors"
            >
              Dừng chia sẻ
            </motion.button>
          </>
        )}

        <div className="text-white/50 text-sm">
          <p>🎬 Đồng bộ với bạn bè qua WebSocket</p>
        </div>
      </div>
    </div>
  )
}
