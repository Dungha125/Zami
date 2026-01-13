import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import MapView from './components/MapView'
import ChatPanel from './components/ChatPanel'
import Sidebar from './components/Sidebar'
import BottomNavbar from './components/BottomNavbar'
import VideoCall from './components/VideoCall'
import MusicSync from './components/MusicSync'
import MovieSync from './components/MovieSync'
import Login from './components/Login'
import Profile from './components/Profile'
import AddFriend from './components/AddFriend'

function App() {
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState<string>('')
  const [showChat, setShowChat] = useState(false)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [showMusic, setShowMusic] = useState(false)
  const [showMovie, setShowMovie] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showAddFriend, setShowAddFriend] = useState(false)

  if (!userId) {
    return <Login onLogin={(id, name) => { setUserId(id); setUsername(name) }} />
  }

  // Determine current view for bottom navbar
  const getCurrentView = (): 'map' | 'chat' | 'video' | 'music' | 'movie' | 'profile' | 'addFriend' => {
    if (showProfile) return 'profile'
    if (showAddFriend) return 'addFriend'
    if (showChat) return 'chat'
    if (showVideoCall) return 'video'
    if (showMusic) return 'music'
    if (showMovie) return 'movie'
    return 'map'
  }

  const goToMap = () => {
    setShowChat(false)
    setShowVideoCall(false)
    setShowMusic(false)
    setShowMovie(false)
    setShowProfile(false)
    setShowAddFriend(false)
  }

  return (
    <Router>
      <div className="flex flex-col md:flex-row h-screen overflow-hidden">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block">
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
        </div>
        
        <div className="flex-1 relative min-h-0 pb-16 md:pb-0">
          {/* Map View - Always rendered and visible for location tracking */}
          <div className="absolute inset-0 w-full h-full">
            <MapView userId={userId} username={username} />
          </div>
          
          {/* Overlay panels */}
          {showChat && (
            <div className="md:absolute md:bottom-4 md:right-4 md:z-[1000] md:w-full md:max-w-md fixed inset-0 md:inset-auto md:bg-transparent bg-white z-[1000]">
              <ChatPanel userId={userId} onClose={() => setShowChat(false)} />
            </div>
          )}
          
          {showVideoCall && (
            <div className="md:absolute md:top-4 md:right-4 md:z-[1000] md:w-full md:max-w-md fixed inset-0 md:inset-auto md:bg-transparent bg-white z-[1000]">
              <VideoCall userId={userId} onClose={() => setShowVideoCall(false)} />
            </div>
          )}
          
          {showMusic && (
            <div className="md:absolute md:top-4 md:left-4 md:z-[1000] md:w-full md:max-w-md fixed inset-0 md:inset-auto md:bg-transparent bg-white z-[1000]">
              <MusicSync userId={userId} onClose={() => setShowMusic(false)} />
            </div>
          )}
          
          {showMovie && (
            <div className="fixed inset-0 z-[1000] bg-black/95 md:absolute">
              <MovieSync userId={userId} onClose={() => setShowMovie(false)} />
            </div>
          )}

          {showProfile && (
            <div className="md:absolute md:top-4 md:left-24 md:right-2 md:z-[1000] md:max-w-md fixed inset-0 md:inset-auto md:bg-white/95 bg-white z-[1000] overflow-y-auto">
              <Profile userId={userId} onClose={() => setShowProfile(false)} />
            </div>
          )}

          {showAddFriend && (
            <div className="md:absolute md:top-4 md:left-24 md:right-2 md:z-[1000] md:max-w-md fixed inset-0 md:inset-auto md:bg-white/95 bg-white z-[1000] overflow-y-auto">
              <AddFriend userId={userId} onClose={() => setShowAddFriend(false)} />
            </div>
          )}
        </div>

        {/* Bottom Navbar - Mobile only */}
        <BottomNavbar
          onChatClick={() => setShowChat(true)}
          onVideoCallClick={() => setShowVideoCall(true)}
          onMusicClick={() => setShowMusic(true)}
          onMovieClick={() => setShowMovie(true)}
          onProfileClick={() => setShowProfile(true)}
          onAddFriendClick={() => setShowAddFriend(true)}
          onMapClick={goToMap}
          currentView={getCurrentView()}
        />
      </div>
    </Router>
  )
}

export default App
