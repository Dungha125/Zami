import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import MapView from './components/MapView'
import ChatPanel from './components/ChatPanel'
import Sidebar from './components/Sidebar'
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

  return (
    <Router>
      <div className="flex h-screen overflow-hidden">
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
        
        <div className="flex-1 relative">
          <MapView userId={userId} username={username} />
          
          {showChat && (
            <div className="absolute bottom-4 right-4 z-[1000]">
              <ChatPanel userId={userId} onClose={() => setShowChat(false)} />
            </div>
          )}
          
          {showVideoCall && (
            <div className="absolute top-4 right-4 z-[1000]">
              <VideoCall userId={userId} onClose={() => setShowVideoCall(false)} />
            </div>
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
            <div className="absolute top-4 left-24 z-[1000]">
              <Profile userId={userId} onClose={() => setShowProfile(false)} />
            </div>
          )}

          {showAddFriend && (
            <div className="absolute top-4 left-24 z-[1000]">
              <AddFriend userId={userId} onClose={() => setShowAddFriend(false)} />
            </div>
          )}
        </div>
      </div>
    </Router>
  )
}

export default App
