import { motion } from 'framer-motion'
import { PhoneIcon, PhoneXMarkIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import { getApiUrl } from '../config/api'

interface CallNotificationProps {
  callerId: string
  callerName: string
  callerAvatar: string | null
  onAccept: () => void
  onReject: () => void
}

export default function CallNotification({ 
  callerId, 
  callerName, 
  callerAvatar,
  onAccept, 
  onReject 
}: CallNotificationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className="fixed top-4 right-4 md:right-24 z-[2000] cute-card bg-white/95 backdrop-blur-md shadow-2xl p-6 max-w-sm"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cute-pink to-cute-lavender flex items-center justify-center text-white text-2xl font-bold overflow-hidden flex-shrink-0">
          {callerAvatar ? (
            <img src={callerAvatar} alt={callerName} className="w-full h-full object-cover" />
          ) : (
            callerName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-gray-800 truncate">{callerName}</h3>
          <p className="text-sm text-gray-500">Đang gọi video...</p>
        </div>
      </div>
      
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReject}
          className="flex-1 p-3 bg-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          <PhoneXMarkIcon className="w-5 h-5" />
          Từ chối
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAccept}
          className="flex-1 p-3 bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          <PhoneIcon className="w-5 h-5" />
          Nghe
        </motion.button>
      </div>
    </motion.div>
  )
}
