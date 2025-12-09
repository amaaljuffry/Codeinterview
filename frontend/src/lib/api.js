/**
 * API service functions for room management
 */

const API_BASE = '/api'

/**
 * Create a new room
 * @param {string} language - Initial language for the room
 * @returns {Promise<{roomId: string}>}
 */
export async function createRoom(language = 'javascript') {
  const response = await fetch(`${API_BASE}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create room')
  }
  
  return response.json()
}

/**
 * Get room information
 * @param {string} roomId - The room ID
 * @returns {Promise<Object>}
 */
export async function getRoom(roomId) {
  const response = await fetch(`${API_BASE}/rooms/${roomId}`)
  
  if (!response.ok) {
    throw new Error('Room not found')
  }
  
  return response.json()
}

/**
 * List all rooms
 * @returns {Promise<Array>}
 */
export async function listRooms() {
  const response = await fetch(`${API_BASE}/rooms`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch rooms')
  }
  
  return response.json()
}

/**
 * Generate WebSocket URL for a room
 * @param {string} roomId - The room ID
 * @returns {string}
 */
export function getWebSocketUrl(roomId) {
  const isProduction = window.location.hostname !== 'localhost'
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  
  if (isProduction) {
    return `${protocol}//${window.location.host}?room=${roomId}`
  }
  
  return `ws://localhost:3001?room=${roomId}`
}
