import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, PaperAirplaneIcon, FaceSmileIcon } from '@heroicons/react/24/outline'
import StickerPicker from './StickerPicker'
import { getWebSocketUrl } from '../config/api'

interface ChatPanelProps {
  userId: string
  onClose: () => void
}

interface Message {
  sender_id: string
  content?: string
  sticker?: string
  timestamp: string
}

export default function ChatPanel({ userId, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [showStickers, setShowStickers] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket(getWebSocketUrl(`ws/${userId}`))
    wsRef.current = ws

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'message') {
        setMessages(prev => [...prev, {
          sender_id: message.sender_id,
          content: message.content,
          sticker: message.sticker,
          timestamp: message.timestamp
        }])
      }
    }

    return () => {
      ws.close()
    }
  }, [userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim() && !showStickers) return

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content: input.trim()
      }))
      setInput('')
    }
  }

  const sendSticker = (stickerId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        sticker: stickerId
      }))
      setShowStickers(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="cute-card w-96 h-[600px] flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-cute-pink/20">
        <h2 className="text-xl font-bold text-cute-pink">💬 Chat</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-cute-pink/20 rounded-full transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl p-3 ${
                  msg.sender_id === userId
                    ? 'bg-gradient-to-r from-cute-pink to-cute-lavender text-white'
                    : 'bg-white/80 text-gray-800'
                }`}
              >
                {msg.sticker && (
                  <div className="text-4xl mb-1">
                    <StickerPicker onSelect={() => {}} selectedSticker={msg.sticker} displayOnly />
                  </div>
                )}
                {msg.content && <p className="text-sm">{msg.content}</p>}
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t-2 border-cute-pink/20">
        <AnimatePresence>
          {showStickers && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3"
            >
              <StickerPicker onSelect={sendSticker} />
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowStickers(!showStickers)}
            className="p-2 hover:bg-cute-pink/20 rounded-full transition-colors"
          >
            <FaceSmileIcon className="w-5 h-5 text-cute-pink" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            className="flex-1 cute-input"
          />
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={sendMessage}
            className="p-2 bg-gradient-to-r from-cute-pink to-cute-lavender text-white rounded-full"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
