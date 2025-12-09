import { Code2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Flex, Text, Box, Container, Separator, Badge, Tooltip } from '@radix-ui/themes'
import { Users, Copy, Check } from 'lucide-react'
import { useState } from 'react'

/**
 * Header component for the application
 * @param {Object} props
 * @param {boolean} props.showConnectionStatus - Show connection indicator
 * @param {boolean} props.connected - WebSocket connection status
 * @param {number} props.userCount - Number of connected users
 * @param {string} props.roomId - Current room ID (for share button)
 */
export default function Header({ 
  showConnectionStatus = false, 
  connected = false, 
  userCount = 0,
  roomId = null 
}) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    if (!roomId) return
    const url = `${window.location.origin}/room/${roomId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Simple header for Home page
  if (!showConnectionStatus) {
    return (
      <Box className="border-b border-zinc-800">
        <Container size="3" px="5" py="4">
          <Flex align="center" gap="2">
            <Code2 className="w-6 h-6" />
            <Text size="5" weight="bold">CodeInterview</Text>
          </Flex>
        </Container>
      </Box>
    )
  }

  // Full header for Room page
  return (
    <Flex 
      align="center" 
      justify="between" 
      px="4" 
      py="3" 
      style={{ borderBottom: '1px solid #27272a' }}
    >
      <Flex align="center" gap="4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          <Code2 className="w-5 h-5" />
          <Text weight="bold">CodeInterview</Text>
        </Button>
        
        <Separator orientation="vertical" size="2" />
        
        <Flex align="center" gap="2">
          <Box 
            style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: connected ? '#22c55e' : '#ef4444' 
            }} 
          />
          <Text size="2" color="gray">
            {connected ? 'Connected' : 'Connecting...'}
          </Text>
        </Flex>
      </Flex>

      <Flex align="center" gap="3">
        {/* Connected Users */}
        <Tooltip content="Connected users">
          <Badge color="gray" variant="soft">
            <Users className="w-3 h-3" />
            <Text size="1">{userCount || 1}</Text>
          </Badge>
        </Tooltip>

        {/* Share Button */}
        {roomId && (
          <Tooltip content="Copy room link">
            <Button
              variant="outline"
              size="2"
              onClick={copyLink}
              style={{ cursor: 'pointer' }}
            >
              {copied ? <Check className="w-4 h-4" style={{ color: '#22c55e' }} /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Share'}
            </Button>
          </Tooltip>
        )}
      </Flex>
    </Flex>
  )
}
