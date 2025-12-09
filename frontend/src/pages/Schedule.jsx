import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Calendar, Plus, ChevronLeft, Clock, Mail, Trash2, Video, FileQuestion, Settings, LogOut, UserCog, ChevronDown } from 'lucide-react'
import { RetroButton, RetroCard, RetroContainer, RetroNavbar, RetroHeading, RetroBadge, RetroEmptyState } from '../components/RetroUI'

export default function Schedule() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [form, setForm] = useState({ title: '', candidateEmail: '', scheduledAt: '', duration: 60, notes: '' })
  const navigate = useNavigate()

  useEffect(() => { const token = localStorage.getItem('token'); if (!token) { navigate('/login'); return }; fetchSchedules(token) }, [])
  const fetchSchedules = async (token) => { try { const res = await fetch('/api/schedule', { headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) setSchedules(await res.json()) } catch (err) { console.error(err) } finally { setLoading(false) } }
  const handleSubmit = async () => { const token = localStorage.getItem('token'); if (!form.candidateEmail || !form.scheduledAt) { alert('Fill required fields'); return }; try { const res = await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(form) }); if (res.ok) { setShowForm(false); setForm({ title: '', candidateEmail: '', scheduledAt: '', duration: 60, notes: '' }); fetchSchedules(token) } } catch (err) { alert('Failed') } }
  const handleCancel = async (id) => { if (!confirm('Cancel?')) return; await fetch(`/api/schedule/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }); setSchedules(schedules.map(s => s.id === id ? { ...s, status: 'cancelled' } : s)) }
  const handleLogout = () => { localStorage.clear(); navigate('/') }
  const statusVariants = { scheduled: 'primary', completed: 'success', cancelled: 'destructive' }
  const upcoming = schedules.filter(s => s.status === 'scheduled'), past = schedules.filter(s => s.status !== 'scheduled')

  return (
    <div className="min-h-screen bg-white">
      <RetroNavbar>
        <div className="flex items-center gap-4">
          <RetroButton variant="ghost" size="sm" onClick={() => navigate('/dashboard')}><ChevronLeft className="w-4 h-4" /> Back</RetroButton>
          <div className="flex items-center gap-2 font-black text-xl text-black"><Calendar className="w-6 h-6" /> Schedule</div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/questions" className="font-semibold text-black hover:text-gray-600 flex items-center gap-1"><FileQuestion className="w-4 h-4" /> Questions</Link>
          <div className="relative">
            <RetroButton variant="outline" size="sm" onClick={() => setMenuOpen(!menuOpen)}><Settings className="w-4 h-4" /><ChevronDown className="w-4 h-4" /></RetroButton>
            {menuOpen && <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border-2 border-black shadow-xl z-50"><button onClick={() => { navigate('/profile'); setMenuOpen(false) }} className="w-full px-4 py-3 text-left font-semibold hover:bg-[var(--primary)] text-black flex items-center gap-2"><UserCog className="w-4 h-4" /> Profile</button><button onClick={handleLogout} className="w-full px-4 py-3 text-left font-semibold hover:bg-red-100 text-red-600 flex items-center gap-2"><LogOut className="w-4 h-4" /> Logout</button></div>}
          </div>
        </div>
      </RetroNavbar>
      <RetroContainer className="py-8">
        <div className="flex justify-between items-center mb-8"><RetroHeading level={2}>Interview Schedule</RetroHeading><RetroButton onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Schedule</RetroButton></div>
        {loading ? <div className="text-center py-12 font-bold text-black">Loading...</div> : <>
          <div className="mb-10"><RetroHeading level={3} className="mb-6">Upcoming</RetroHeading>{upcoming.length === 0 ? <RetroEmptyState icon={Calendar} title="No upcoming" description="Schedule ahead" action={<RetroButton onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Schedule</RetroButton>} /> : <div className="space-y-4">{upcoming.map(s => <RetroCard key={s.id} className="p-5" variant="accent" hover={false}><div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div className="flex items-center gap-4"><div className="w-14 h-14 bg-white rounded-xl border-2 border-black flex items-center justify-center"><Clock className="w-7 h-7 text-black" /></div><div><h4 className="font-bold text-lg text-black">{s.title || 'Interview'}</h4><div className="flex items-center gap-2 text-gray-700"><Mail className="w-4 h-4" /><span>{s.candidateEmail}</span></div><p className="text-sm text-gray-600 mt-1">{new Date(s.scheduledAt).toLocaleString()} • {s.duration} min</p></div></div><div className="flex gap-2">{s.roomId && <RetroButton size="sm" variant="primary" onClick={() => navigate(`/room/${s.roomId}`)}><Video className="w-4 h-4" /> Join</RetroButton>}<RetroButton size="sm" variant="danger" onClick={() => handleCancel(s.id)}><Trash2 className="w-4 h-4" /></RetroButton></div></div></RetroCard>)}</div>}</div>
          {past.length > 0 && <div><RetroHeading level={3} className="mb-6">Past</RetroHeading><div className="space-y-3">{past.map(s => <RetroCard key={s.id} className="p-4 opacity-70" hover={false}><div className="flex items-center justify-between"><div><div className="flex items-center gap-3"><h4 className="font-bold text-black">{s.title || s.candidateEmail}</h4><RetroBadge variant={statusVariants[s.status]}>{s.status}</RetroBadge></div><p className="text-sm text-gray-600">{new Date(s.scheduledAt).toLocaleString()}</p></div></div></RetroCard>)}</div></div>}
        </>}
      </RetroContainer>
      {showForm && <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><RetroCard className="w-full max-w-lg p-6"><h2 className="font-bold text-2xl mb-6 text-black">Schedule Interview</h2><div className="space-y-4"><div><label className="block text-sm font-bold mb-2 text-black">Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-black" placeholder="Frontend Interview" /></div><div><label className="block text-sm font-bold mb-2 text-black">Email *</label><input type="email" value={form.candidateEmail} onChange={(e) => setForm({ ...form, candidateEmail: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-black" /></div><div><label className="block text-sm font-bold mb-2 text-black">Date & Time *</label><input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-black" /></div><div><label className="block text-sm font-bold mb-2 text-black">Duration (min)</label><input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 60 })} className="w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-black" /></div></div><div className="flex gap-3 mt-6"><RetroButton variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</RetroButton><RetroButton variant="primary" onClick={handleSubmit} className="flex-1">Schedule</RetroButton></div></RetroCard></div>}
    </div>
  )
}
