import { Terminal, X } from 'lucide-react'
import { Flex, Text, Box, IconButton, ScrollArea, Tooltip } from '@radix-ui/themes'

/**
 * Output panel component for displaying code execution results
 * @param {Object} props
 * @param {Array} props.output - Array of output lines { type: 'log'|'error'|'warn'|'result', content: string }
 * @param {Function} props.onClear - Callback to clear output
 */
export default function OutputPanel({ output = [], onClear }) {
  return (
    <Flex direction="column" style={{ width: 384, background: '#0a0a0a' }}>
      <Flex 
        align="center" 
        gap="2" 
        px="4" 
        py="2" 
        style={{ borderBottom: '1px solid #27272a' }}
      >
        <Terminal className="w-4 h-4" style={{ color: '#71717a' }} />
        <Text size="2" weight="medium">Output</Text>
        {output.length > 0 && (
          <Tooltip content="Clear output">
            <IconButton
              size="1"
              variant="ghost"
              onClick={onClear}
              style={{ marginLeft: 'auto', cursor: 'pointer' }}
            >
              <X className="w-4 h-4" />
            </IconButton>
          </Tooltip>
        )}
      </Flex>
      
      <ScrollArea style={{ flex: 1 }}>
        <Box p="4" style={{ fontFamily: 'monospace', fontSize: 13 }}>
          {output.length === 0 ? (
            <Text size="2" color="gray">
              Click "Run" to execute your code
            </Text>
          ) : (
            output.map((line, i) => (
              <Box
                key={i}
                py="1"
                style={{
                  color:
                    line.type === 'error'
                      ? '#f87171'
                      : line.type === 'warn'
                      ? '#fbbf24'
                      : line.type === 'result'
                      ? '#4ade80'
                      : '#d4d4d8',
                }}
              >
                {line.type === 'error' && <span style={{ color: '#ef4444' }}>✕ </span>}
                {line.type === 'result' && <span style={{ color: '#22c55e' }}>→ </span>}
                {line.content}
              </Box>
            ))
          )}
        </Box>
      </ScrollArea>
    </Flex>
  )
}
