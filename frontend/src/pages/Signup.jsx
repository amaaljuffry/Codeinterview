import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Code2, Mail, Lock, User, ArrowRight } from 'lucide-react'
import { RetroButton, RetroCard, RetroContainer, RetroHeading } from '../components/RetroUI'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return }
    try {
      const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Signup failed'); return }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/dashboard')
    } catch (err) { setError('An error occurred') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="fixed top-20 right-10 w-20 h-20 bg-[var(--accent)] rounded-3xl rotate-12 opacity-20" />
      <div className="fixed bottom-20 left-10 w-16 h-16 bg-[var(--primary)] rounded-2xl -rotate-12 opacity-20" />

      <RetroContainer size="sm" className="relative z-10 w-full max-w-md">
        <RetroCard className="p-8">
          <Link to="/" className="flex items-center justify-center gap-2 font-black text-2xl text-black mb-8">
            <div className="w-12 h-12 bg-[var(--primary)] rounded-xl border-2 border-black flex items-center justify-center"><Code2 className="w-6 h-6 text-black" /></div>
            CodeInterview
          </Link>

          <RetroHeading level={3} className="text-center mb-6">Create Account</RetroHeading>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-2 text-black">Name</label>
              <div className="relative">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 pl-12 rounded-lg border-2 border-black bg-white text-black font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" placeholder="John Doe" required />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-black">Email</label>
              <div className="relative">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 pl-12 rounded-lg border-2 border-black bg-white text-black font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" placeholder="you@example.com" required />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-black">Password</label>
              <div className="relative">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 pl-12 rounded-lg border-2 border-black bg-white text-black font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" placeholder="••••••••" required />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <p className="mt-1 text-sm text-gray-500">Minimum 6 characters</p>
            </div>
            {error && <div className="bg-red-50 border-2 border-red-500 rounded-lg p-3 font-bold text-red-600">{error}</div>}
            <RetroButton type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Account'} <ArrowRight className="w-5 h-5" /></RetroButton>
          </form>

          <div className="mt-6 pt-6 border-t-2 border-gray-200 text-center">
            <p className="text-gray-600">Already have an account? <Link to="/login" className="font-bold text-black hover:text-gray-600">Sign in</Link></p>
          </div>
        </RetroCard>
        <p className="text-center mt-6 text-gray-600"><Link to="/" className="font-bold text-black hover:text-gray-600">← Back to Home</Link></p>
      </RetroContainer>
    </div>
  )
}
