import { useRef, useCallback } from 'react'
import MonacoEditor from '@monaco-editor/react'
import { Box } from '@radix-ui/themes'

/**
 * Code Editor component using Monaco Editor
 * @param {Object} props
 * @param {string} props.code - Current code content
 * @param {string} props.language - Programming language
 * @param {Function} props.onChange - Callback when code changes
 * @param {Object} props.options - Additional Monaco editor options
 */
export default function Editor({ 
  code = '', 
  language = 'javascript', 
  onChange,
  options = {}
}) {
  const editorRef = useRef(null)

  const handleEditorMount = useCallback((editor) => {
    editorRef.current = editor
  }, [])

  const handleChange = useCallback((value) => {
    if (onChange) {
      onChange(value || '')
    }
  }, [onChange])

  const defaultOptions = {
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on',
    padding: { top: 16 },
    ...options
  }

  return (
    <Box style={{ flex: 1, height: '100%' }}>
      <MonacoEditor
        height="100%"
        language={language}
        value={code}
        onChange={handleChange}
        theme="vs-dark"
        onMount={handleEditorMount}
        options={defaultOptions}
      />
    </Box>
  )
}
