import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, PaperAirplaneIcon, FaceSmileIcon, CheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import StickerPicker from './StickerPicker'
import { getWebSocketUrl, getApiUrl } from '../config/api'
import axios from 'axios'

interface ChatPanelProps {
  userId: string
  onClose: () => void
}

interface Friend {
  user_id: string
  username: string
  avatar: string | null
  bio: string
}

interface Message {
  id: number
  sender_id: string
  receiver_id: string
  content?: string
  sticker?: string
  status: 'sent' | 'delivered' | 'read'
  created_at: string
  delivered_at?: string | null
  read_at?: string | null
}

export default function ChatPanel({ userId, onClose }: ChatPanelProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [showStickers, setShowStickers] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [friendTyping, setFriendTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // Load messages when friend is selected
  useEffect(() => {
    if (selectedFriendId) {
      loadMessages(selectedFriendId)
    } else {
      setMessages([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFriendId, userId])

  const loadMessages = async (friendId: string) => {
    try {
      const response = await axios.get(getApiUrl(`api/users/${userId}/messages/${friendId}`))
      setMessages(response.data.messages || [])
      
      // Mark messages as read
      const unreadIds = response.data.messages
        .filter((msg: Message) => msg.receiver_id === userId && msg.status !== 'read')
        .map((msg: Message) => msg.id)
      
      if (unreadIds.length > 0) {
        markMessagesAsRead(unreadIds)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const markMessagesAsRead = async (messageIds: number[]) => {
    try {
      await axios.post(getApiUrl(`api/users/${userId}/messages/status`), {
        message_ids: messageIds,
        status: 'read'
      })
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(getWebSocketUrl(`ws/${userId}`))
    wsRef.current = ws

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      
      if (message.type === 'message') {
        // Only add message if it's for the selected friend
        if (selectedFriendId && (
          (message.sender_id === selectedFriendId && message.receiver_id === userId) ||
          (message.sender_id === userId && message.receiver_id === selectedFriendId)
        )) {
          setMessages(prev => {
            // Check if message already exists
            const exists = prev.some(m => m.id === message.id)
            if (exists) return prev
            return [...prev, message]
          })
          
          // Mark as delivered if we received it
          if (message.receiver_id === userId) {
            markMessagesAsRead([message.id])
          }
        }
      } else if (message.type === 'typing_status') {
        if (message.sender_id === selectedFriendId) {
          setFriendTyping(message.is_typing)
        }
      } else if (message.type === 'messages_read') {
        // Update message status to read
        setMessages(prev => prev.map(msg => 
          message.message_ids.includes(msg.id) && msg.sender_id === userId
            ? { ...msg, status: 'read', read_at: new Date().toISOString() }
            : msg
        ))
      }
    }

    return () => {
      ws.close()
    }
  }, [userId, selectedFriendId])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle typing indicator
  const handleInputChange = (value: string) => {
    setInput(value)
    
    if (selectedFriendId && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (!isTyping && value.trim()) {
        setIsTyping(true)
        wsRef.current.send(JSON.stringify({
          type: 'typing_start',
          receiver_id: selectedFriendId
        }))
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Set timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'typing_stop',
            receiver_id: selectedFriendId
          }))
        }
      }, 1000)
    }
  }

  const sendMessage = () => {
    if (!input.trim() && !showStickers) return
    if (!selectedFriendId) return

    // Stop typing indicator
    if (isTyping && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setIsTyping(false)
      wsRef.current.send(JSON.stringify({
        type: 'typing_stop',
        receiver_id: selectedFriendId
      }))
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        receiver_id: selectedFriendId,
        content: input.trim()
      }))
      setInput('')
    }
  }

  const sendSticker = (stickerId: string) => {
    if (!selectedFriendId) return

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        receiver_id: selectedFriendId,
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

  const getStatusIcon = (status: string, isOwnMessage: boolean) => {
    if (!isOwnMessage) return null
    
    if (status === 'read') {
      return <CheckCircleIcon className="w-4 h-4 text-blue-500" />
    } else if (status === 'delivered') {
      return <CheckIcon className="w-4 h-4 text-gray-400" />
    } else {
      return <CheckIcon className="w-4 h-4 text-gray-300" />
    }
  }

  const selectedFriend = friends.find(f => f.user_id === selectedFriendId)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="cute-card w-full max-w-md h-[600px] flex flex-col shadow-2xl"
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

      {!selectedFriendId ? (
        // Friend selection view
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Chọn bạn bè để chat</h3>
          <div className="space-y-2">
            {friends.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>Chưa có bạn bè nào</p>
                <p className="text-sm mt-2">Thêm bạn bè để bắt đầu chat</p>
              </div>
            ) : (
              friends.map((friend) => (
                <motion.button
                  key={friend.user_id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedFriendId(friend.user_id)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/50 hover:bg-white/80 transition-colors border border-cute-pink/20"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cute-pink to-cute-lavender flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt={friend.username} className="w-full h-full object-cover" />
                    ) : (
                      friend.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-800">{friend.username}</div>
                    {friend.bio && (
                      <div className="text-sm text-gray-500 truncate">{friend.bio}</div>
                    )}
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Chat header with friend info */}
          <div className="flex items-center gap-3 p-4 border-b-2 border-cute-pink/20 bg-white/50">
            <button
              onClick={() => setSelectedFriendId(null)}
              className="text-cute-pink hover:text-pink-600 font-medium text-sm"
            >
              ← Quay lại
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cute-pink to-cute-lavender flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
              {selectedFriend?.avatar ? (
                <img src={selectedFriend.avatar} alt={selectedFriend.username} className="w-full h-full object-cover" />
              ) : (
                selectedFriend?.username.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-800">{selectedFriend?.username}</div>
              {friendTyping && (
                <div className="text-xs text-gray-500">Đang nhập...</div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence>
              {messages.map((msg) => {
                const isOwnMessage = msg.sender_id === userId
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl p-3 ${
                        isOwnMessage
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
                      <div className="flex items-center gap-1 mt-1">
                        <p className="text-xs opacity-70">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {getStatusIcon(msg.status, isOwnMessage)}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {friendTyping && (
              <div className="flex justify-start">
                <div className="bg-white/80 rounded-2xl px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
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
                onChange={(e) => handleInputChange(e.target.value)}
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
