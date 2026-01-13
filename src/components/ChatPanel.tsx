import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, PaperAirplaneIcon, FaceSmileIcon } from '@heroicons/react/24/outline'
import StickerPicker from './StickerPicker'
import { getWebSocketUrl, getApiUrl } from '../config/api'
import axios from 'axios'

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

interface Friend {
  user_id: string
  username: string
  avatar: string | null
}

export default function ChatPanel({ userId, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [showStickers, setShowStickers] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // Load friends list
  useEffect(() => {
    const loadFriends = async () => {
      try {
        const response = await axios.get(getApiUrl(`api/users/${userId}/friends`))
        setFriends(response.data.friends || [])
      } catch (error) {
        console.error('Error loading friends:', error)
      }
    }
    loadFriends()
  }, [userId])

  useEffect(() => {
    const ws = new WebSocket(getWebSocketUrl(`ws/${userId}`))
    wsRef.current = ws

    ws.onopen = () => {
      console.log('Chat WebSocket connected')
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message.type === 'message') {
          // Only show messages from/to selected friend
          if (selectedFriendId && (message.sender_id === selectedFriendId || message.sender_id === userId)) {
            setMessages(prev => [...prev, {
              sender_id: message.sender_id,
              content: message.content,
              sticker: message.sticker,
              timestamp: message.timestamp
            }])
          }
        }
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('Chat WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('Chat WebSocket closed')
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [userId, selectedFriendId])

  // Clear messages when friend selection changes
  useEffect(() => {
    setMessages([])
  }, [selectedFriendId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim() && !showStickers) return
    if (!selectedFriendId) {
      alert('Vui lòng chọn người để chat')
      return
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const messageToSend = {
        type: 'message',
        target_id: selectedFriendId,
        content: input.trim()
      }
      
      // Add message to local state immediately for instant feedback
      const newMessage: Message = {
        sender_id: userId,
        content: input.trim(),
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, newMessage])
      setInput('')
      
      // Send to server
      wsRef.current.send(JSON.stringify(messageToSend))
    }
  }

  const sendSticker = (stickerId: string) => {
    if (!selectedFriendId) {
      alert('Vui lòng chọn người để chat')
      return
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const messageToSend = {
        type: 'message',
        target_id: selectedFriendId,
        sticker: stickerId
      }
      
      // Add sticker to local state immediately
      const newMessage: Message = {
        sender_id: userId,
        sticker: stickerId,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, newMessage])
      setShowStickers(false)
      
      // Send to server
      wsRef.current.send(JSON.stringify(messageToSend))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const selectedFriend = friends.find(f => f.user_id === selectedFriendId)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="cute-card w-full md:w-96 h-[500px] md:h-[600px] flex flex-col shadow-2xl bg-white/95 backdrop-blur-md"
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

      {/* Friend Selection */}
      {!selectedFriendId ? (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn người để chat:
            </label>
            {friends.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Bạn chưa có bạn bè để chat</p>
                <p className="text-sm mt-2">Thêm bạn bè để bắt đầu trò chuyện</p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <motion.button
                    key={friend.user_id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedFriendId(friend.user_id)}
                    className="w-full p-3 rounded-xl border-2 border-gray-200 hover:border-cute-pink transition-colors bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cute-pink to-cute-lavender flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                        {friend.avatar ? (
                          <img src={friend.avatar} alt={friend.username} className="w-full h-full object-cover" />
                        ) : (
                          friend.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="flex-1 text-left font-medium">{friend.username}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Selected Friend Header */}
          <div className="p-4 border-b-2 border-cute-pink/20 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedFriendId(null)}
                className="text-gray-600 hover:text-cute-pink transition-colors"
              >
                ← Quay lại
              </button>
              {selectedFriend && (
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cute-pink to-cute-lavender flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                    {selectedFriend.avatar ? (
                      <img src={selectedFriend.avatar} alt={selectedFriend.username} className="w-full h-full object-cover" />
                    ) : (
                      selectedFriend.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="font-medium">{selectedFriend.username}</span>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                <p>Chưa có tin nhắn. Hãy bắt đầu trò chuyện!</p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((msg, index) => (
                  <motion.div
                    key={`${msg.sender_id}-${index}-${msg.timestamp}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${
                        msg.sender_id === userId
                          ? 'bg-gradient-to-r from-cute-pink to-cute-lavender text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      {msg.sticker && (
                        <div className="text-4xl mb-1 flex justify-center">
                          <StickerPicker onSelect={() => {}} selectedSticker={msg.sticker} displayOnly />
                        </div>
                      )}
                      {msg.content && <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>}
                      <p className={`text-xs mt-1 ${msg.sender_id === userId ? 'opacity-80' : 'opacity-60'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
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
        </>
      )}
    </motion.div>
  )
}
