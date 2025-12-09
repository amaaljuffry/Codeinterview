import { useState, useEffect, useRef, useCallback } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

/**
 * Custom hook for Yjs collaborative editing
 * @param {string} roomId - The room ID to connect to
 * @param {string} username - Current user's username
 * @param {string} defaultCode - Default code to initialize with
 * @returns {Object} - { code, setCode, connected, users, handleCodeChange }
 */
export default function useYjs(roomId, username, defaultCode = '') {
  const [code, setCode] = useState(defaultCode)
  const [connected, setConnected] = useState(false)
  const [users, setUsers] = useState([])
  const ydocRef = useRef(null)
  const providerRef = useRef(null)

  useEffect(() => {
    if (!roomId) return

    const ydoc = new Y.Doc()
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}?room=${roomId}`
    
    // For development, connect directly to server port
    const devWsUrl = `ws://localhost:3001?room=${roomId}`
    const provider = new WebsocketProvider(
      window.location.hostname === 'localhost' ? devWsUrl : wsUrl,
      roomId,
      ydoc
    )

    ydocRef.current = ydoc
    providerRef.current = provider

    provider.on('status', (event) => {
      setConnected(event.status === 'connected')
    })

    // Awareness for user presence
    const awareness = provider.awareness
    awareness.setLocalStateField('user', {
      name: username || 'Anonymous',
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    })

    awareness.on('change', () => {
      const states = Array.from(awareness.getStates().values())
      setUsers(states.map((s) => s.user).filter(Boolean))
    })

    // Sync code with Yjs
    const ytext = ydoc.getText('code')
    
    ytext.observe(() => {
      const newCode = ytext.toString()
      setCode(newCode)
    })

    // Initialize with default code if empty
    if (ytext.toString() === '') {
      ytext.insert(0, defaultCode)
    } else {
      setCode(ytext.toString())
    }

    return () => {
      provider.destroy()
      ydoc.destroy()
    }
  }, [roomId, username, defaultCode])

  // Handle code changes from editor
  const handleCodeChange = useCallback((value) => {
    setCode(value || '')
    
    if (ydocRef.current && providerRef.current?.wsconnected) {
      const ytext = ydocRef.current.getText('code')
      const currentYText = ytext.toString()
      
      if (value !== currentYText) {
        ydocRef.current.transact(() => {
          ytext.delete(0, ytext.length)
          ytext.insert(0, value || '')
        })
      }
    }
  }, [])

  return {
    code,
    setCode,
    connected,
    users,
    handleCodeChange,
    ydocRef,
    providerRef
  }
}
