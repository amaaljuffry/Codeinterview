import { useState, useRef, useCallback } from 'react'

/**
 * Custom hook for running JavaScript and Python code
 * @returns {Object} - { output, isRunning, pyodideLoading, runCode, clearOutput }
 */
export default function useCodeRunner() {
  const [output, setOutput] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [pyodideLoading, setPyodideLoading] = useState(false)
  const runnerIframeRef = useRef(null)

  // Create sandboxed iframe for JS execution
  const createRunnerIframe = useCallback(() => {
    if (runnerIframeRef.current) {
      document.body.removeChild(runnerIframeRef.current)
    }

    const iframe = document.createElement('iframe')
    iframe.sandbox = 'allow-scripts'
    iframe.style.display = 'none'
    iframe.srcdoc = `
      <!DOCTYPE html>
      <html>
      <body>
        <script>
          const logs = [];
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          
          console.log = (...args) => {
            logs.push({ type: 'log', content: args.map(String).join(' ') });
          };
          console.error = (...args) => {
            logs.push({ type: 'error', content: args.map(String).join(' ') });
          };
          console.warn = (...args) => {
            logs.push({ type: 'warn', content: args.map(String).join(' ') });
          };

          window.addEventListener('message', async (ev) => {
            const { id, code } = ev.data;
            logs.length = 0;
            
            try {
              const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
              const fn = new AsyncFunction(code);
              const result = await fn();
              
              if (result !== undefined) {
                logs.push({ type: 'result', content: String(result) });
              }
              
              parent.postMessage({ id, type: 'success', logs }, '*');
            } catch (err) {
              logs.push({ type: 'error', content: String(err) });
              parent.postMessage({ id, type: 'error', logs }, '*');
            }
          });
        </script>
      </body>
      </html>
    `
    document.body.appendChild(iframe)
    runnerIframeRef.current = iframe
    return iframe
  }, [])

  // Run JavaScript code
  const runJavaScript = useCallback((codeToRun) => {
    return new Promise((resolve) => {
      const iframe = createRunnerIframe()
      const runId = Date.now().toString()

      const timeout = setTimeout(() => {
        resolve([{ type: 'error', content: 'Execution timed out (5s limit)' }])
        if (runnerIframeRef.current) {
          document.body.removeChild(runnerIframeRef.current)
          runnerIframeRef.current = null
        }
      }, 5000)

      const handler = (ev) => {
        if (ev.data?.id === runId) {
          clearTimeout(timeout)
          window.removeEventListener('message', handler)
          resolve(ev.data.logs || [])
        }
      }

      window.addEventListener('message', handler)

      // Wait for iframe to load
      setTimeout(() => {
        iframe.contentWindow?.postMessage({ id: runId, code: codeToRun }, '*')
      }, 100)
    })
  }, [createRunnerIframe])

  // Run Python code with Pyodide
  const runPython = useCallback(async (codeToRun) => {
    setPyodideLoading(true)
    
    try {
      // Load Pyodide if not already loaded
      if (!window.pyodide) {
        setOutput([{ type: 'log', content: 'Loading Python runtime (Pyodide)...' }])
        
        // Load Pyodide script
        if (!window.loadPyodide) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
        }
        
        window.pyodide = await window.loadPyodide()
      }

      // Capture stdout
      window.pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
      `)

      // Run user code
      await window.pyodide.runPythonAsync(codeToRun)

      // Get output
      const stdout = window.pyodide.runPython('sys.stdout.getvalue()')
      const stderr = window.pyodide.runPython('sys.stderr.getvalue()')

      const logs = []
      if (stdout) {
        stdout.split('\n').filter(Boolean).forEach((line) => {
          logs.push({ type: 'log', content: line })
        })
      }
      if (stderr) {
        stderr.split('\n').filter(Boolean).forEach((line) => {
          logs.push({ type: 'error', content: line })
        })
      }

      return logs.length > 0 ? logs : [{ type: 'log', content: '(No output)' }]
    } catch (err) {
      return [{ type: 'error', content: String(err) }]
    } finally {
      setPyodideLoading(false)
    }
  }, [])

  // Main run code function
  const runCode = useCallback(async (code, language) => {
    setIsRunning(true)
    setOutput([{ type: 'log', content: 'Running...' }])

    try {
      let result
      if (language === 'javascript') {
        result = await runJavaScript(code)
      } else if (language === 'python') {
        result = await runPython(code)
      } else {
        result = [{ type: 'warn', content: `Execution not supported for ${language}. Only JavaScript and Python can be run.` }]
      }
      setOutput(result)
    } catch (err) {
      setOutput([{ type: 'error', content: String(err) }])
    } finally {
      setIsRunning(false)
    }
  }, [runJavaScript, runPython])

  const clearOutput = useCallback(() => {
    setOutput([])
  }, [])

  return {
    output,
    isRunning,
    pyodideLoading,
    runCode,
    clearOutput,
    setOutput
  }
}
