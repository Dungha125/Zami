import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { XMarkIcon, VideoCameraIcon, VideoCameraSlashIcon, PhoneIcon, PhoneXMarkIcon } from '@heroicons/react/24/outline'
import { getWebSocketUrl } from '../config/api'

interface VideoCallProps {
  userId: string
  onClose: () => void
}

export default function VideoCall({ userId, onClose }: VideoCallProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const ws = new WebSocket(getWebSocketUrl(`ws/${userId}`))
    wsRef.current = ws

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data)
      
      if (message.type === 'webrtc_offer') {
        await handleOffer(message.offer, message.sender_id)
      } else if (message.type === 'webrtc_answer') {
        await handleAnswer(message.answer)
      } else if (message.type === 'webrtc_ice_candidate') {
        await handleIceCandidate(message.candidate)
      }
    }

    return () => {
      ws.close()
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
    }
  }, [userId])

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })
      
      peerConnectionRef.current = pc

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'webrtc_ice_candidate',
            candidate: event.candidate,
            target_id: 'broadcast' // In real app, specify target user
          }))
        }
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'webrtc_offer',
          offer: offer,
          target_id: 'broadcast'
        }))
      }

      setIsCallActive(true)
    } catch (error) {
      console.error('Error starting call:', error)
      alert('Không thể truy cập camera/microphone. Vui lòng kiểm tra quyền truy cập.')
    }
  }

  const handleOffer = async (offer: RTCSessionDescriptionInit, senderId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })
      
      peerConnectionRef.current = pc

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'webrtc_ice_candidate',
            candidate: event.candidate,
            target_id: senderId
          }))
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'webrtc_answer',
          answer: answer,
          target_id: senderId
        }))
      }

      setIsCallActive(true)
    } catch (error) {
      console.error('Error handling offer:', error)
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
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
    setIsCallActive(false)
    onClose()
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
      className="cute-card w-96 bg-white/95 backdrop-blur-md"
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
            <div className="aspect-video bg-gray-200 rounded-2xl flex items-center justify-center">
              <VideoCameraIcon className="w-16 h-16 text-gray-400" />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startCall}
              className="w-full cute-button bg-gradient-to-r from-green-400 to-green-600 text-white"
            >
              <PhoneIcon className="w-5 h-5 inline mr-2" />
              Bắt đầu cuộc gọi
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
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
