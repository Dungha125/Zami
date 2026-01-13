import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, MagnifyingGlassIcon, UserPlusIcon, CheckIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import { getApiUrl } from '../config/api'

interface AddFriendProps {
  userId: string
  onClose: () => void
}

interface User {
  user_id: string
  username: string
  avatar: string | null
  bio: string
  is_friend: boolean
}

export default function AddFriend({ userId, onClose }: AddFriendProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null)

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        searchUsers()
      }, 500) // Debounce 500ms
      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const searchUsers = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const response = await axios.get(getApiUrl('api/users/search'), {
        params: {
          query: searchQuery,
          current_user_id: userId
        }
      })
      setSearchResults(response.data.users || [])
    } catch (error) {
      console.error('Error searching users:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const addFriend = async (friendId: string) => {
    setAddingFriendId(friendId)
    try {
      await axios.post(getApiUrl(`api/users/${userId}/friends`), {
        friend_user_id: friendId
      })
      // Update search results
      setSearchResults(prev => 
        prev.map(user => 
          user.user_id === friendId 
            ? { ...user, is_friend: true }
            : user
        )
      )
    } catch (error: any) {
      console.error('Error adding friend:', error)
      alert(error.response?.data?.detail || 'Có lỗi xảy ra khi thêm bạn')
    } finally {
      setAddingFriendId(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="cute-card w-96 max-h-[600px] flex flex-col bg-white/95 backdrop-blur-md"
    >
      <div className="p-4 border-b-2 border-cute-pink/20 flex items-center justify-between">
        <h2 className="text-xl font-bold text-cute-pink flex items-center gap-2">
          <UserPlusIcon className="w-6 h-6" />
          Thêm bạn bè
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-cute-pink/20 rounded-full transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 border-b-2 border-cute-pink/10">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên người dùng..."
            className="cute-input w-full pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isSearching && (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cute-pink mx-auto mb-2"></div>
            <p>Đang tìm kiếm...</p>
          </div>
        )}

        {!isSearching && searchQuery.trim() && searchResults.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Không tìm thấy người dùng nào</p>
          </div>
        )}

        {!isSearching && !searchQuery.trim() && (
          <div className="text-center py-8 text-gray-500">
            <UserPlusIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Nhập tên người dùng để tìm kiếm</p>
          </div>
        )}

        <AnimatePresence>
          {searchResults.map((user) => (
            <motion.div
              key={user.user_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-cute-pink/10 transition-colors mb-2"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cute-pink to-cute-lavender flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover rounded-full" />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{user.username}</p>
                {user.bio && (
                  <p className="text-sm text-gray-500 truncate">{user.bio}</p>
                )}
              </div>

              {user.is_friend ? (
                <div className="flex items-center gap-2 text-green-500 px-3 py-1 rounded-full bg-green-100">
                  <CheckIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Đã kết bạn</span>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addFriend(user.user_id)}
                  disabled={addingFriendId === user.user_id}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-cute-pink to-cute-lavender text-white font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {addingFriendId === user.user_id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Đang thêm...</span>
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="w-4 h-4" />
                      <span>Thêm bạn</span>
                    </>
                  )}
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
