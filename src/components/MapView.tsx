import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'
import { getWebSocketUrl, getApiUrl } from '../config/api'

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface MapViewProps {
  userId: string
  username: string
}

interface Location {
  lat: number
  lng: number
  user_id: string
  username: string
  timestamp: string
  accuracy?: number
}

interface UserProfile {
  avatar: string | null
  username: string
}

function MapUpdater({ userId, username, onLocationsUpdate }: { 
  userId: string, 
  username: string,
  onLocationsUpdate: (locs: Record<string, Location>) => void
}) {
  const wsRef = useRef<WebSocket | null>(null)
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const onLocationsUpdateRef = useRef(onLocationsUpdate)

  // Keep ref in sync
  useEffect(() => {
    onLocationsUpdateRef.current = onLocationsUpdate
  }, [onLocationsUpdate])

  useEffect(() => {
    // Get user's current location
    const initLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords
            
            // Connect WebSocket
            const ws = new WebSocket(getWebSocketUrl(`ws/${userId}`))
            wsRef.current = ws

            ws.onopen = () => {
              // Send initial location
              ws.send(JSON.stringify({
                type: 'location_update',
                lat: latitude,
                lng: longitude,
                accuracy: accuracy,
                username: username
              }))

              // Update location periodically
              locationIntervalRef.current = setInterval(() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    if (ws.readyState === WebSocket.OPEN) {
                      ws.send(JSON.stringify({
                        type: 'location_update',
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        username: username
                      }))
                    }
                  })
                }
              }, 5000) // Update every 5 seconds
            }

            ws.onmessage = (event) => {
              const message = JSON.parse(event.data)
              
              if (message.type === 'location_update') {
                onLocationsUpdateRef.current({
                  [message.user_id]: message.location
                })
              } else if (message.type === 'initial_locations') {
                const locs: Record<string, Location> = {}
                message.locations.forEach((loc: Location) => {
                  locs[loc.user_id] = loc
                })
                onLocationsUpdateRef.current(locs)
              }
            }

            ws.onerror = (error) => {
              console.error('WebSocket error:', error)
            }

            ws.onclose = () => {
              console.log('WebSocket closed')
            }
          },
          (error) => {
            console.error('Geolocation error:', error)
            // Fallback - still connect WebSocket
            const ws = new WebSocket(getWebSocketUrl(`ws/${userId}`))
            wsRef.current = ws
            
            ws.onmessage = (event) => {
              const message = JSON.parse(event.data)
              
              if (message.type === 'location_update') {
                onLocationsUpdateRef.current({
                  [message.user_id]: message.location
                })
              } else if (message.type === 'initial_locations') {
                const locs: Record<string, Location> = {}
                message.locations.forEach((loc: Location) => {
                  locs[loc.user_id] = loc
                })
                onLocationsUpdateRef.current(locs)
              }
            }
          }
        )
      }
    }

    initLocation()

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [userId, username])

  return null
}

export default function MapView({ userId, username }: MapViewProps) {
  const [center, setCenter] = useState<[number, number]>([10.762622, 106.660172]) // Ho Chi Minh City
  const [locations, setLocations] = useState<Record<string, Location>>({})
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({})
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set([userId]))
  const centerSetRef = useRef(false)

  // Load friends list
  useEffect(() => {
    const loadFriends = async () => {
      try {
        const response = await axios.get(getApiUrl(`api/users/${userId}/friends`))
        const friends = response.data.friends || []
        const friendSet = new Set<string>()
        // Always include current user
        friendSet.add(userId)
        // Add all friend IDs from the friends list (each friend has user_id property)
        friends.forEach((f: any) => {
          if (f.user_id && f.user_id !== userId) {
            friendSet.add(f.user_id)
          }
        })
        setFriendIds(friendSet)
      } catch (error) {
        console.error('Error loading friends:', error)
        // On error, at least show current user
        setFriendIds(new Set([userId]))
      }
    }
    loadFriends()
  }, [userId])

  // Get initial location only once
  useEffect(() => {
    if (!centerSetRef.current && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude])
          centerSetRef.current = true
        },
        () => {
          centerSetRef.current = true
        }
      )
    }
  }, [])

  // Filter locations to only show friends + current user
  const filteredLocations = useMemo(() => {
    const filtered: Record<string, Location> = {}
    Object.entries(locations).forEach(([uid, loc]) => {
      if (friendIds.has(uid)) {
        filtered[uid] = loc
      }
    })
    return filtered
  }, [locations, friendIds])

  // Load profiles for filtered users only
  useEffect(() => {
    const loadProfiles = async () => {
      const userIds = Object.keys(filteredLocations)
      const newProfiles: Record<string, UserProfile> = {}
      
      for (const uid of userIds) {
        // Skip if we already have this profile
        if (userProfiles[uid]) {
          newProfiles[uid] = userProfiles[uid]
          continue
        }
        
        try {
          const response = await axios.get(getApiUrl(`api/users/${uid}/profile`))
          newProfiles[uid] = {
            avatar: response.data.avatar || null,
            username: response.data.username || filteredLocations[uid]?.username || uid
          }
        } catch (error) {
          console.error(`Error loading profile for ${uid}:`, error)
          newProfiles[uid] = {
            avatar: null,
            username: filteredLocations[uid]?.username || uid
          }
        }
      }
      
      if (Object.keys(newProfiles).length > 0) {
        setUserProfiles(prev => ({ ...prev, ...newProfiles }))
      }
    }

    if (Object.keys(filteredLocations).length > 0) {
      loadProfiles()
    }
  }, [filteredLocations])

  // Memoize handleLocationsUpdate to prevent WebSocket re-creation
  const handleLocationsUpdate = useCallback((newLocs: Record<string, Location>) => {
    setLocations(prev => {
      const updated = { ...prev, ...newLocs }
      // Only center map on user's location once at the beginning
      if (!centerSetRef.current) {
        const userLocation = updated[userId]
        if (userLocation) {
          setCenter([userLocation.lat, userLocation.lng])
          centerSetRef.current = true
        }
      }
      return updated
    })
  }, [userId])

  // Create custom icon with avatar - memoized
  const createCustomIcon = useCallback((user_id: string, isCurrentUser: boolean) => {
    const profile = userProfiles[user_id]
    const avatar = profile?.avatar
    const username = profile?.username || filteredLocations[user_id]?.username || user_id
    const initial = username.charAt(0).toUpperCase()
    const bgColor = isCurrentUser ? '#FFB6C1' : '#E6E6FA'
    
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: ${avatar ? 'transparent' : bgColor};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 18px;
        overflow: hidden;
      ">
        ${avatar 
          ? `<img src="${avatar}" alt="${username}" style="width: 100%; height: 100%; object-fit: cover;" />`
          : initial
        }
      </div>`,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    })
  }, [userProfiles, filteredLocations])

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        key={`${center[0]}-${center[1]}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater userId={userId} username={username} onLocationsUpdate={handleLocationsUpdate} />
        
        {Object.values(filteredLocations).map((location) => {
          const isCurrentUser = location.user_id === userId
          const accuracy = location.accuracy || 0
          
          return (
            <React.Fragment key={location.user_id}>
              {/* Accuracy Circle - chỉ hiển thị nếu có accuracy và > 0 */}
              {accuracy > 0 && (
                <Circle
                  center={[location.lat, location.lng]}
                  radius={accuracy}
                  pathOptions={{
                    fillColor: isCurrentUser ? '#FFB6C1' : '#E6E6FA',
                    fillOpacity: 0.2,
                    color: isCurrentUser ? '#FFB6C1' : '#E6E6FA',
                    weight: 1,
                    opacity: 0.4
                  }}
                />
              )}
              
              {/* Marker với avatar */}
              <Marker
                position={[location.lat, location.lng]}
                icon={createCustomIcon(location.user_id, isCurrentUser)}
              >
                <Popup>
                  <div className="text-center">
                    <div className="font-bold text-cute-pink">
                      {userProfiles[location.user_id]?.username || location.username || location.user_id}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(location.timestamp).toLocaleTimeString()}
                    </div>
                    {accuracy > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        Độ chính xác: {Math.round(accuracy)}m
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          )
        })}
      </MapContainer>
    </div>
  )
}
