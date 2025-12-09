import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Code2, Users, Play, Zap, Calendar, FileQuestion, ArrowRight, ChevronDown, LayoutDashboard, UserCog, LogOut, Sparkles } from 'lucide-react'
import { RetroButton, RetroCard, RetroContainer, RetroSection, RetroNavbar, RetroHeading, RetroFeatureCard, RetroInput } from '../components/RetroUI'
import { API_BASE } from '../lib'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [joinRoomId, setJoinRoomId] = useState('')
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) { try { setUser(JSON.parse(storedUser)) } catch (e) { localStorage.removeItem('user'); localStorage.removeItem('token') } }
  }, [])

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); setMenuOpen(false) }

  const createRoom = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ language: 'javascript' }) })
      const data = await res.json()
      navigate(`/room/${data.roomId}`)
    } catch (err) { console.error('Failed:', err); alert('Failed to create room') }
    finally { setLoading(false) }
  }

  const joinRoom = () => { if (joinRoomId.trim()) navigate(`/room/${joinRoomId.trim()}`) }

  const features = [
    { icon: Code2, title: 'Real-time Editor', description: 'Collaborative Monaco editor with syntax highlighting and live sync.', variant: 'primary' },
    { icon: Play, title: 'Code Execution', description: 'Run JavaScript and Python directly in the browser.', variant: 'accent' },
    { icon: Users, title: 'Multiple Users', description: 'Invite candidates, interviewers, and observers.', variant: 'primary' },
    { icon: Calendar, title: 'Scheduling', description: 'Plan interviews ahead and manage your calendar.', variant: 'accent' },
    { icon: FileQuestion, title: 'Question Bank', description: 'Build your library of coding challenges.', variant: 'primary' },
    { icon: Zap, title: 'Lightning Fast', description: 'Yjs-powered real-time sync. No lag, just code.', variant: 'accent' }
  ]

  return (
    <div className="min-h-screen bg-white">
      <RetroNavbar>
        <Link to="/" className="flex items-center gap-2 font-black text-xl text-black">
          <div className="w-10 h-10 bg-[var(--primary)] rounded-xl border-2 border-black flex items-center justify-center">
            <Code2 className="w-5 h-5 text-black" />
          </div>
          CodeInterview
        </Link>
        
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative">
              <RetroButton variant="outline" size="sm" onClick={() => setMenuOpen(!menuOpen)}>
                {user.name || user.email}
                <ChevronDown className="w-4 h-4" />
              </RetroButton>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border-2 border-black shadow-xl overflow-hidden z-50">
                  <button onClick={() => { navigate('/dashboard'); setMenuOpen(false) }} className="w-full px-4 py-3 text-left font-semibold hover:bg-[var(--primary)] text-black flex items-center gap-2 transition-colors"><LayoutDashboard className="w-4 h-4" /> Dashboard</button>
                  <button onClick={() => { navigate('/questions'); setMenuOpen(false) }} className="w-full px-4 py-3 text-left font-semibold hover:bg-[var(--primary)] text-black flex items-center gap-2 transition-colors"><FileQuestion className="w-4 h-4" /> Questions</button>
                  <button onClick={() => { navigate('/schedule'); setMenuOpen(false) }} className="w-full px-4 py-3 text-left font-semibold hover:bg-[var(--primary)] text-black flex items-center gap-2 transition-colors"><Calendar className="w-4 h-4" /> Schedule</button>
                  <button onClick={() => { navigate('/profile'); setMenuOpen(false) }} className="w-full px-4 py-3 text-left font-semibold hover:bg-[var(--primary)] text-black flex items-center gap-2 transition-colors"><UserCog className="w-4 h-4" /> Profile</button>
                  <button onClick={handleLogout} className="w-full px-4 py-3 text-left font-semibold hover:bg-red-100 text-red-600 flex items-center gap-2 transition-colors"><LogOut className="w-4 h-4" /> Logout</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <RetroButton variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</RetroButton>
              <RetroButton variant="primary" size="sm" onClick={() => navigate('/signup')}>Sign Up</RetroButton>
            </>
          )}
        </div>
      </RetroNavbar>

      {/* Hero */}
      <RetroSection variant="default" className="relative overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-[var(--primary)] rounded-3xl rotate-12 opacity-20" />
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-[var(--accent)] rounded-2xl -rotate-12 opacity-20" />
        
        <RetroContainer className="relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[var(--primary)] rounded-full px-4 py-2 font-bold text-sm mb-8 text-black border-2 border-black">
              <Sparkles className="w-4 h-4" /> Real-time Collaborative Coding
            </div>
            
            <RetroHeading level={1} className="mb-6">
              The Ultimate
              <span className="block bg-[var(--primary)] text-black px-6 py-3 rounded-2xl inline-block mt-4 -rotate-1 border-2 border-black">
                Code Interview Platform
              </span>
            </RetroHeading>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Create a room, share the link, and code together in real-time. Execute JavaScript and Python directly in the browser.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <RetroButton variant="primary" size="lg" onClick={createRoom} disabled={loading}>
                {loading ? 'Creating...' : 'Start Interview'} <ArrowRight className="w-5 h-5" />
              </RetroButton>
              {user ? (
                <RetroButton variant="secondary" size="lg" onClick={() => navigate('/dashboard')}>Go to Dashboard</RetroButton>
              ) : (
                <RetroButton variant="outline" size="lg" onClick={() => navigate('/signup')}>Create Account</RetroButton>
              )}
            </div>
          </div>
        </RetroContainer>
      </RetroSection>

      {/* Features */}
      <RetroSection variant="muted">
        <RetroContainer>
          <div className="text-center mb-16">
            <RetroHeading level={2} className="mb-4">Everything You Need</RetroHeading>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Built for technical interviews, pair programming, and collaborative coding.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => <RetroFeatureCard key={i} icon={f.icon} title={f.title} description={f.description} variant={f.variant} />)}
          </div>
        </RetroContainer>
      </RetroSection>

      {/* CTA */}
      <RetroSection variant="primary">
        <RetroContainer>
          <div className="text-center">
            <RetroHeading level={2} className="mb-6">Ready to Start?</RetroHeading>
            <p className="text-lg text-black opacity-80 mb-8 max-w-xl mx-auto">Create your first interview room in seconds. No credit card required.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <RetroButton variant="secondary" size="lg" onClick={createRoom}>Create Free Room <ArrowRight className="w-5 h-5" /></RetroButton>
              <RetroButton variant="outline" size="lg" onClick={() => navigate('/signup')}>Sign Up for Free</RetroButton>
            </div>
          </div>
        </RetroContainer>
      </RetroSection>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <RetroContainer>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 font-black text-xl">
              <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center"><Code2 className="w-5 h-5 text-black" /></div>
              CodeInterview
            </div>
            <div className="flex gap-6 opacity-80">
              <Link to="/dashboard" className="hover:text-[var(--primary)] font-semibold transition-colors">Dashboard</Link>
              <Link to="/questions" className="hover:text-[var(--primary)] font-semibold transition-colors">Questions</Link>
              <Link to="/schedule" className="hover:text-[var(--primary)] font-semibold transition-colors">Schedule</Link>
            </div>
            <p className="opacity-60 text-sm">© 2024 CodeInterview. Built with ❤️</p>
          </div>
        </RetroContainer>
      </footer>
    </div>
  )
}
