import { BrowserRouter as Router } from 'react-router-dom'
import { useState, useEffect } from 'react'
import MapView from './components/MapView'
import ChatPanel from './components/ChatPanel'
import Sidebar from './components/Sidebar'
import VideoCall from './components/VideoCall'
import MusicSync from './components/MusicSync'
import MovieSync from './components/MovieSync'
import Login from './components/Login'
import Profile from './components/Profile'
import AddFriend from './components/AddFriend'
import CallNotification from './components/CallNotification'
import { getWebSocketUrl, getApiUrl } from './config/api'
import axios from 'axios'

interface IncomingCall {
  callerId: string
  callerName: string
  callerAvatar: string | null
  offer: RTCSessionDescriptionInit
}

function App() {
  // Load saved credentials from localStorage
  const [userId, setUserId] = useState<string | null>(() => {
    return localStorage.getItem('userId')
  })
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('username') || ''
  })
  const [showChat, setShowChat] = useState(false)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [showMusic, setShowMusic] = useState(false)
  const [showMovie, setShowMovie] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)

  // Handle login and save to localStorage
  const handleLogin = (id: string, name: string) => {
    setUserId(id)
    setUsername(name)
    localStorage.setItem('userId', id)
    localStorage.setItem('username', name)
  }

  // Handle logout
  const handleLogout = () => {
    setUserId(null)
    setUsername('')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    setShowProfile(false)
  }

  // Listen for incoming calls
  useEffect(() => {
    if (!userId) return

    const ws = new WebSocket(getWebSocketUrl(`ws/${userId}`))
    
    ws.onopen = () => {
      console.log('Call notification WebSocket connected')
    }
    
    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message.type === 'webrtc_offer' && message.sender_id !== userId) {
          // Load caller profile
          try {
            const response = await axios.get(getApiUrl(`api/users/${message.sender_id}/profile`))
            setIncomingCall({
              callerId: message.sender_id,
              callerName: response.data.username || message.sender_id,
              callerAvatar: response.data.avatar || null,
              offer: message.offer
            })
          } catch (error) {
            console.error('Error loading caller profile:', error)
            setIncomingCall({
              callerId: message.sender_id,
              callerName: message.sender_id,
              callerAvatar: null,
              offer: message.offer
            })
          }
        }
      } catch (error) {
        console.error('Error parsing call notification message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('Call notification WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('Call notification WebSocket closed')
    }

    return () => {
      ws.close()
    }
  }, [userId])

  const handleAcceptCall = () => {
    if (incomingCall) {
      setShowVideoCall(true)
      // incomingCall state will be passed to VideoCall via props
    }
  }

  const handleRejectCall = () => {
    setIncomingCall(null)
  }

  // Clear incoming call when VideoCall closes
  useEffect(() => {
    if (!showVideoCall && incomingCall) {
      // Don't clear immediately - wait a bit in case user reopens
      const timer = setTimeout(() => {
        setIncomingCall(null)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [showVideoCall, incomingCall])

  if (!userId) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <Router>
      <div className="flex flex-col md:flex-row h-screen overflow-hidden">
        <Sidebar
          username={username}
          userId={userId}
          onChatClick={() => setShowChat(!showChat)}
          onVideoCallClick={() => setShowVideoCall(!showVideoCall)}
          onMusicClick={() => setShowMusic(!showMusic)}
          onMovieClick={() => setShowMovie(!showMovie)}
          onProfileClick={() => setShowProfile(true)}
          onAddFriendClick={() => setShowAddFriend(true)}
        />
        
        <div className="flex-1 relative mb-16 md:mb-0 md:ml-20">
          <MapView userId={userId} username={username} />
          
          {showChat && (
            <div className="absolute bottom-4 right-4 md:right-4 z-[1000] w-[calc(100%-2rem)] md:w-auto">
              <ChatPanel userId={userId} onClose={() => setShowChat(false)} />
            </div>
          )}
          
          {showVideoCall && (
            <div className="absolute top-4 right-4 md:right-4 z-[1000] w-[calc(100%-2rem)] md:w-auto">
              <VideoCall 
                userId={userId} 
                onClose={() => setShowVideoCall(false)} 
                incomingOffer={incomingCall?.offer}
                incomingCallerId={incomingCall?.callerId}
              />
            </div>
          )}

          {incomingCall && !showVideoCall && (
            <CallNotification
              callerId={incomingCall.callerId}
              callerName={incomingCall.callerName}
              callerAvatar={incomingCall.callerAvatar}
              onAccept={handleAcceptCall}
              onReject={handleRejectCall}
            />
          )}
          
          {showMusic && (
            <div className="absolute top-4 left-4 z-[1000]">
              <MusicSync userId={userId} onClose={() => setShowMusic(false)} />
            </div>
          )}
          
          {showMovie && (
            <div className="absolute inset-0 z-[1000] bg-black/90">
              <MovieSync userId={userId} onClose={() => setShowMovie(false)} />
            </div>
          )}

          {showProfile && (
            <div className="absolute top-4 left-4 md:left-24 z-[1000] w-[calc(100%-2rem)] md:w-auto max-w-md">
              <Profile userId={userId} onClose={() => setShowProfile(false)} onLogout={handleLogout} />
            </div>
          )}

          {showAddFriend && (
            <div className="absolute top-4 left-4 md:left-24 z-[1000] w-[calc(100%-2rem)] md:w-auto max-w-md">
              <AddFriend userId={userId} onClose={() => setShowAddFriend(false)} />
            </div>
          )}
        </div>
      </div>
    </Router>
  )
}

export default App
