import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { XMarkIcon, VideoCameraIcon, VideoCameraSlashIcon, PhoneIcon, PhoneXMarkIcon } from '@heroicons/react/24/outline'
import { getWebSocketUrl, getApiUrl } from '../config/api'
import axios from 'axios'

interface VideoCallProps {
  userId: string
  onClose: () => void
  incomingOffer?: RTCSessionDescriptionInit
  incomingCallerId?: string
}

interface Friend {
  user_id: string
  username: string
  avatar: string | null
}

export default function VideoCall({ userId, onClose, incomingOffer, incomingCallerId }: VideoCallProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null)
  const [callStatus, setCallStatus] = useState<string>('')
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const targetUserIdRef = useRef<string | null>(null)

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
      setCallStatus('Đã kết nối')
      // Handle incoming offer if it exists (from notification)
      if (incomingOffer && incomingCallerId) {
        handleOffer(incomingOffer, incomingCallerId)
      }
    }

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data)
      
      if (message.type === 'webrtc_offer') {
        // Incoming calls are now handled by App.tsx via CallNotification
        // This is only for handling offers during an active call
        if (isCallActive && message.sender_id !== userId && message.sender_id === targetUserIdRef.current) {
          await handleOffer(message.offer, message.sender_id)
        }
      } else if (message.type === 'webrtc_answer') {
        if (message.sender_id === targetUserIdRef.current) {
          setCallStatus('Đã kết nối')
          await handleAnswer(message.answer)
        }
      } else if (message.type === 'webrtc_ice_candidate') {
        if (message.sender_id === targetUserIdRef.current || targetUserIdRef.current === null) {
          await handleIceCandidate(message.candidate)
        }
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setCallStatus('Lỗi kết nối')
    }

    ws.onclose = () => {
      setCallStatus('Đã ngắt kết nối')
    }

    return () => {
      ws.close()
      endCall()
    }
  }, [userId, incomingOffer, incomingCallerId])

  const startCall = async (targetUserId: string) => {
    if (!targetUserId) {
      alert('Vui lòng chọn người để gọi')
      return
    }

    try {
      setCallStatus('Đang mở camera...')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      })
      
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.play().catch(console.error)
      }

      setCallStatus('Đang thiết lập kết nối...')
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      })
      
      peerConnectionRef.current = pc
      targetUserIdRef.current = targetUserId

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
          remoteVideoRef.current.play().catch(console.error)
        }
        setCallStatus('Đã kết nối')
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'webrtc_ice_candidate',
            candidate: event.candidate,
            target_id: targetUserId
          }))
        }
      }

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          setCallStatus('Kết nối bị gián đoạn')
        } else if (pc.iceConnectionState === 'connected') {
          setCallStatus('Đã kết nối')
        }
      }

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })
      await pc.setLocalDescription(offer)

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'webrtc_offer',
          offer: offer,
          target_id: targetUserId
        }))
        setCallStatus('Đang gọi...')
      }

      setIsCallActive(true)
    } catch (error: any) {
      console.error('Error starting call:', error)
      let errorMsg = 'Không thể truy cập camera/microphone.'
      if (error.name === 'NotAllowedError') {
        errorMsg = 'Vui lòng cho phép truy cập camera/microphone trong cài đặt trình duyệt.'
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'Không tìm thấy camera/microphone.'
      } else if (error.name === 'NotReadableError') {
        errorMsg = 'Camera/microphone đang được sử dụng bởi ứng dụng khác.'
      }
      alert(errorMsg)
      setCallStatus('Lỗi: ' + errorMsg)
    }
  }

  const handleOffer = async (offer: RTCSessionDescriptionInit, senderId: string) => {
    try {
      setCallStatus('Đang trả lời cuộc gọi...')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      })
      
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.play().catch(console.error)
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      })
      
      peerConnectionRef.current = pc
      targetUserIdRef.current = senderId

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
          remoteVideoRef.current.play().catch(console.error)
        }
        setCallStatus('Đã kết nối')
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'webrtc_ice_candidate',
            candidate: event.candidate,
            target_id: senderId
          }))
        }
      }

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          setCallStatus('Kết nối bị gián đoạn')
        } else if (pc.iceConnectionState === 'connected') {
          setCallStatus('Đã kết nối')
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })
      await pc.setLocalDescription(answer)

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'webrtc_answer',
          answer: answer,
          target_id: senderId
        }))
      }

      setIsCallActive(true)
      setCallStatus('Đã kết nối')
    } catch (error: any) {
      console.error('Error handling offer:', error)
      alert('Lỗi khi trả lời cuộc gọi: ' + (error.message || 'Unknown error'))
      setCallStatus('Lỗi: ' + (error.message || 'Unknown error'))
    }
  }

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
    }
  }

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }
    targetUserIdRef.current = null
    setIsCallActive(false)
    setCallStatus('')
    setSelectedFriendId(null)
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsVideoEnabled(!isVideoEnabled)
    }
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="cute-card w-full md:w-96 bg-white/95 backdrop-blur-md"
    >
      <div className="p-4 border-b-2 border-cute-pink/20 flex items-center justify-between">
        <h2 className="text-xl font-bold text-cute-pink">📹 Video Call</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-cute-pink/20 rounded-full transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4">
        {!isCallActive ? (
          <div className="space-y-4">
            {friends.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Bạn chưa có bạn bè để gọi</p>
                <p className="text-sm mt-2">Thêm bạn bè để bắt đầu gọi video</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn người để gọi:
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {friends.map((friend) => (
                      <motion.button
                        key={friend.user_id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedFriendId(friend.user_id)}
                        className={`w-full p-3 rounded-xl border-2 transition-colors ${
                          selectedFriendId === friend.user_id
                            ? 'border-cute-pink bg-cute-pink/20'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cute-pink to-cute-lavender flex items-center justify-center text-white font-bold overflow-hidden">
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
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectedFriendId && startCall(selectedFriendId)}
                  disabled={!selectedFriendId}
                  className="w-full cute-button bg-gradient-to-r from-green-400 to-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PhoneIcon className="w-5 h-5 inline mr-2" />
                  Bắt đầu cuộc gọi
                </motion.button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {callStatus && (
              <div className="text-center text-sm text-gray-600 bg-gray-100 py-2 rounded-lg">
                {callStatus}
              </div>
            )}
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              {!remoteVideoRef.current?.srcObject && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <VideoCameraIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p className="text-sm opacity-75">Đang chờ kết nối...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleVideo}
                className={`p-3 rounded-full ${
                  isVideoEnabled ? 'bg-blue-500' : 'bg-gray-500'
                } text-white`}
              >
                {isVideoEnabled ? (
                  <VideoCameraIcon className="w-6 h-6" />
                ) : (
                  <VideoCameraSlashIcon className="w-6 h-6" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={endCall}
                className="p-3 rounded-full bg-red-500 text-white"
              >
                <PhoneXMarkIcon className="w-6 h-6" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMute}
                className={`p-3 rounded-full ${
                  !isMuted ? 'bg-green-500' : 'bg-gray-500'
                } text-white`}
              >
                🎤
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
