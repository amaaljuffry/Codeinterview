/**
 * Supported programming languages
 */
export const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', ext: 'js' },
  { id: 'python', name: 'Python', ext: 'py' },
  { id: 'typescript', name: 'TypeScript', ext: 'ts' },
]

/**
 * Default code templates for each language
 */
export const DEFAULT_CODE = {
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

/**
 * Editor configuration options
 */
export const EDITOR_OPTIONS = {
  fontSize: 14,
  fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  wordWrap: 'on',
  padding: { top: 16 },
}

/**
 * WebSocket connection timeout in milliseconds
 */
export const WS_TIMEOUT = 5000

/**
 * Code execution timeout in milliseconds
 */
export const CODE_EXECUTION_TIMEOUT = 5000

/**
 * Pyodide CDN URL
 */
export const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
