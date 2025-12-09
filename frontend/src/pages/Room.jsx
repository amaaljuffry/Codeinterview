import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { Play, Copy, Check, Users, Code2, Loader2, Terminal, X, ChevronLeft } from 'lucide-react'
import { RetroButton, RetroBadge } from '../components/RetroUI'

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', ext: 'js' },
  { id: 'python', name: 'Python', ext: 'py' },
  { id: 'typescript', name: 'TypeScript', ext: 'ts' },
]

const DEFAULT_CODE = {
  javascript: `// JavaScript - Click "Run" to execute
console.log("Hello, World!");

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci(10):", fibonacci(10));
`,
  python: `# Python - Click "Run" to execute
print("Hello, World!")

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("Fibonacci(10):", fibonacci(10))
`,
  typescript: `// TypeScript - Syntax highlighting only
interface User {
  name: string;
  age: number;
}

const greet = (user: User): string => {
  return \`Hello, \${user.name}!\`;
};

console.log(greet({ name: "Alice", age: 30 }));
`,
}

export default function Room() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState(DEFAULT_CODE.javascript)
  const [output, setOutput] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [pyodideLoading, setPyodideLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [connected, setConnected] = useState(false)
  const [users, setUsers] = useState([])
  const [username, setUsername] = useState('')
  const [isGuest, setIsGuest] = useState(true)
  const editorRef = useRef(null)
  const ydocRef = useRef(null)
  const providerRef = useRef(null)
  const runnerIframeRef = useRef(null)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setUsername(user.name || user.email || 'User')
        setIsGuest(false)
      } catch (e) {
        // Fall back to guest
        const guestName = `Guest${Math.floor(Math.random() * 1000)}`
        setUsername(guestName)
        setIsGuest(true)
      }
    } else {
      // Guest user - generate random name
      const guestName = `Guest${Math.floor(Math.random() * 1000)}`
      setUsername(guestName)
      setIsGuest(true)
    }
  }, [])

  useEffect(() => {
    if (!roomId) return
    const ydoc = new Y.Doc()
    const devWsUrl = `ws://localhost:3001?room=${roomId}`
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}?room=${roomId}`
    const provider = new WebsocketProvider(window.location.hostname === 'localhost' ? devWsUrl : wsUrl, roomId, ydoc)
    ydocRef.current = ydoc
    providerRef.current = provider
    provider.on('status', (event) => setConnected(event.status === 'connected'))
    const awareness = provider.awareness
    awareness.setLocalStateField('user', { name: username || 'Anonymous', color: `hsl(${Math.random() * 360}, 70%, 60%)` })
    awareness.on('change', () => { const states = Array.from(awareness.getStates().values()); setUsers(states.map((s) => s.user).filter(Boolean)) })
    const ytext = ydoc.getText('code')
    ytext.observe(() => { const newCode = ytext.toString(); if (newCode !== code) setCode(newCode) })
    if (ytext.toString() === '') ytext.insert(0, DEFAULT_CODE.javascript)
    else setCode(ytext.toString())
    return () => { provider.destroy(); ydoc.destroy() }
  }, [roomId, username])

  const handleCodeChange = useCallback((value) => {
    setCode(value || '')
    if (ydocRef.current && providerRef.current?.wsconnected) {
      const ytext = ydocRef.current.getText('code')
      if (value !== ytext.toString()) ydocRef.current.transact(() => { ytext.delete(0, ytext.length); ytext.insert(0, value || '') })
    }
  }, [])

  const copyLink = () => { navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const createRunnerIframe = () => {
    if (runnerIframeRef.current) document.body.removeChild(runnerIframeRef.current)
    const iframe = document.createElement('iframe')
    iframe.sandbox = 'allow-scripts'
    iframe.style.display = 'none'
    iframe.srcdoc = `<!DOCTYPE html><html><body><script>const logs=[];console.log=(...a)=>logs.push({type:'log',content:a.map(String).join(' ')});console.error=(...a)=>logs.push({type:'error',content:a.map(String).join(' ')});console.warn=(...a)=>logs.push({type:'warn',content:a.map(String).join(' ')});window.addEventListener('message',async(ev)=>{const{id,code}=ev.data;logs.length=0;try{const fn=new(Object.getPrototypeOf(async function(){}).constructor)(code);const r=await fn();if(r!==undefined)logs.push({type:'result',content:String(r)});parent.postMessage({id,type:'success',logs},'*')}catch(e){logs.push({type:'error',content:String(e)});parent.postMessage({id,type:'error',logs},'*')}});</script></body></html>`
    document.body.appendChild(iframe)
    runnerIframeRef.current = iframe
    return iframe
  }

  const runJavaScript = (codeToRun) => new Promise((resolve) => {
    const iframe = createRunnerIframe()
    const runId = Date.now().toString()
    const timeout = setTimeout(() => { resolve([{ type: 'error', content: 'Execution timed out (5s limit)' }]); if (runnerIframeRef.current) { document.body.removeChild(runnerIframeRef.current); runnerIframeRef.current = null } }, 5000)
    const handler = (ev) => { if (ev.data?.id === runId) { clearTimeout(timeout); window.removeEventListener('message', handler); resolve(ev.data.logs || []) } }
    window.addEventListener('message', handler)
    setTimeout(() => iframe.contentWindow?.postMessage({ id: runId, code: codeToRun }, '*'), 100)
  })

  const runPython = async (codeToRun) => {
    setPyodideLoading(true)
    try {
      if (!window.pyodide) {
        setOutput([{ type: 'log', content: 'Loading Python runtime...' }])
        if (!window.loadPyodide) await new Promise((resolve, reject) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'; s.onload = resolve; s.onerror = reject; document.head.appendChild(s) })
        window.pyodide = await window.loadPyodide()
      }
      window.pyodide.runPython(`import sys\nfrom io import StringIO\nsys.stdout = StringIO()\nsys.stderr = StringIO()`)
      await window.pyodide.runPythonAsync(codeToRun)
      const stdout = window.pyodide.runPython('sys.stdout.getvalue()'), stderr = window.pyodide.runPython('sys.stderr.getvalue()')
      const logs = []
      if (stdout) stdout.split('\n').filter(Boolean).forEach((l) => logs.push({ type: 'log', content: l }))
      if (stderr) stderr.split('\n').filter(Boolean).forEach((l) => logs.push({ type: 'error', content: l }))
      return logs.length > 0 ? logs : [{ type: 'log', content: '(No output)' }]
    } catch (err) { return [{ type: 'error', content: String(err) }] }
    finally { setPyodideLoading(false) }
  }

  const runCode = async () => {
    setIsRunning(true); setOutput([{ type: 'log', content: 'Running...' }])
    try { let result; if (language === 'javascript') result = await runJavaScript(code); else if (language === 'python') result = await runPython(code); else result = [{ type: 'warn', content: `Execution not supported for ${language}` }]; setOutput(result) }
    catch (err) { setOutput([{ type: 'error', content: String(err) }]) }
    finally { setIsRunning(false) }
  }

  const changeLanguage = (langId) => { setLanguage(langId); const isDefault = Object.values(DEFAULT_CODE).some((d) => d === code); if (isDefault) handleCodeChange(DEFAULT_CODE[langId] || '') }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header - RetroUI Style */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black bg-white">
        <div className="flex items-center gap-4">
          <RetroButton variant="ghost" size="sm" onClick={() => navigate('/')}><ChevronLeft className="w-4 h-4" /> Back</RetroButton>
          <div className="flex items-center gap-2 font-black text-xl text-black">
            <div className="w-8 h-8 bg-[var(--primary)] rounded-lg border-2 border-black flex items-center justify-center"><Code2 className="w-4 h-4 text-black" /></div>
            CodeInterview
          </div>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">{connected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">{username}</span>
          {isGuest && <RetroBadge variant="warning">Guest</RetroBadge>}
          <RetroBadge variant="default"><Users className="w-3 h-3" /> {users.length || 1}</RetroBadge>
          <RetroButton variant="outline" size="sm" onClick={copyLink}>{copied ? <><Check className="w-4 h-4 text-green-600" /> Copied!</> : <><Copy className="w-4 h-4" /> Share</>}</RetroButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Panel */}
        <div className="flex flex-col flex-1 border-r-2 border-black">
          {/* Editor Toolbar - RetroUI Style */}
          <div className="flex items-center justify-between px-4 py-2 border-b-2 border-black bg-gray-50">
            <select value={language} onChange={(e) => changeLanguage(e.target.value)} className="px-3 py-2 rounded-lg border-2 border-black bg-white text-black font-bold cursor-pointer focus:outline-none">
              {LANGUAGES.map((lang) => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
            </select>
            <RetroButton variant="primary" size="sm" onClick={runCode} disabled={isRunning || pyodideLoading}>
              {isRunning || pyodideLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run
            </RetroButton>
          </div>
          {/* Monaco Editor - Dark Theme */}
          <div className="flex-1 bg-[#1e1e1e]">
            <Editor height="100%" language={language} value={code} onChange={handleCodeChange} theme="vs-dark" onMount={(editor) => { editorRef.current = editor }} options={{ fontSize: 14, fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace', minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true, tabSize: 2, wordWrap: 'on', padding: { top: 16 } }} />
          </div>
        </div>

        {/* Output Panel - Dark Theme */}
        <div className="flex flex-col w-96 bg-[#1e1e1e]">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-700 bg-[#252526]">
            <Terminal className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-white">Output</span>
            {output.length > 0 && <button onClick={() => setOutput([])} className="ml-auto text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>}
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-sm">
            {output.length === 0 ? <span className="text-gray-500">Click "Run" to execute your code</span> : output.map((line, i) => (
              <div key={i} className={`py-1 ${line.type === 'error' ? 'text-red-400' : line.type === 'warn' ? 'text-yellow-400' : line.type === 'result' ? 'text-green-400' : 'text-gray-300'}`}>
                {line.type === 'error' && <span className="text-red-500">✕ </span>}
                {line.type === 'result' && <span className="text-green-500">→ </span>}
                {line.content}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
