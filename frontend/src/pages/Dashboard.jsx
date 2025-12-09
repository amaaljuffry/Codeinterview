import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Code2, Plus, Calendar, FileQuestion, Clock, ChevronRight, Trash2, Play, LogOut, Settings, UserCog, ChevronDown, X } from 'lucide-react'
import { RetroButton, RetroCard, RetroContainer, RetroNavbar, RetroHeading, RetroBadge, RetroEmptyState, RetroToggle } from '../components/RetroUI'
import { Table } from '../components/RetroTable'
import { retroToast } from '../components/RetroToast'
import { API_BASE } from '../lib'

export default function Dashboard() {
  const [rooms, setRooms] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [roomForm, setRoomForm] = useState({
    name: '',
    language: 'javascript',
    description: '',
    scheduleForLater: false,
    scheduledAt: '',
    candidateEmail: '',
    duration: 60
  })
  const navigate = useNavigate()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (!storedUser || !token) { navigate('/login'); return }
    setUser(JSON.parse(storedUser))
    fetchData(token)
  }, [])

  const fetchData = async (token) => {
    try {
      const [roomsRes, schedulesRes] = await Promise.all([
        fetch(`${API_BASE}/rooms`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/schedule`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      if (roomsRes.ok) setRooms(await roomsRes.json())
      if (schedulesRes.ok) setSchedules(await schedulesRes.json())
    } catch (err) { console.error('Failed:', err) }
    finally { setLoading(false) }
  }

  const openCreateModal = () => {
    setRoomForm({ name: '', language: 'javascript', description: '', scheduleForLater: false, scheduledAt: '', candidateEmail: '', duration: 60 })
    setShowCreateModal(true)
  }

  const createRoom = async () => {
    const token = localStorage.getItem('token')
    if (!roomForm.name.trim()) { retroToast.warning('Please enter a room name'); return }
    if (roomForm.scheduleForLater && (!roomForm.scheduledAt || !roomForm.candidateEmail)) {
      retroToast.warning('Please fill in schedule date and candidate email'); return
    }
    setCreating(true)
    try {
      // Create room
      const roomRes = await fetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: roomForm.name.trim(), language: roomForm.language })
      })
      const roomData = await roomRes.json()

      // If scheduled, also create schedule entry
      if (roomForm.scheduleForLater) {
        await fetch(`${API_BASE}/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            title: roomForm.name.trim(),
            candidateEmail: roomForm.candidateEmail.trim(),
            scheduledAt: roomForm.scheduledAt,
            duration: roomForm.duration,
            roomId: roomData.roomId,
            notes: roomForm.description.trim()
          })
        })
        setShowCreateModal(false)
        fetchData(token) // Refresh lists
        retroToast.success('Interview scheduled successfully!')
      } else {
        setShowCreateModal(false)
        navigate(`/room/${roomData.roomId}`)
        retroToast.success('Room created successfully!')
      }
    } catch (err) { retroToast.error('Failed to create room') }
    finally { setCreating(false) }
  }

  const deleteRoom = async (id) => {
    if (!confirm('Delete this room?')) return
    const token = localStorage.getItem('token')
    try {
      await fetch(`${API_BASE}/rooms/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
      setRooms(rooms.filter(r => r.id !== id))
      retroToast.success('Room deleted successfully')
    } catch (err) {
      retroToast.error('Failed to delete room')
    }
  }

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/') }
  const statusVariants = { waiting: 'warning', active: 'success', ended: 'destructive' }

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><RetroCard className="p-8"><div className="animate-pulse font-bold text-xl text-black">Loading...</div></RetroCard></div>

  return (
    <div className="min-h-screen bg-white">
      <RetroNavbar>
        <Link to="/" className="flex items-center gap-2 font-black text-xl text-black">
          <div className="w-10 h-10 bg-[var(--primary)] rounded-xl border-2 border-black flex items-center justify-center"><Code2 className="w-5 h-5 text-black" /></div>
          CodeInterview
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/questions" className="font-semibold text-black hover:text-gray-600 flex items-center gap-1"><FileQuestion className="w-4 h-4" /> Questions</Link>
          <Link to="/schedule" className="font-semibold text-black hover:text-gray-600 flex items-center gap-1"><Calendar className="w-4 h-4" /> Schedule</Link>
          <div className="relative">
            <RetroButton variant="outline" size="sm" onClick={() => setMenuOpen(!menuOpen)}><Settings className="w-4 h-4" /><ChevronDown className="w-4 h-4" /></RetroButton>
            {menuOpen && <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border-2 border-black shadow-xl z-50"><button onClick={() => { navigate('/profile'); setMenuOpen(false) }} className="w-full px-4 py-3 text-left font-semibold hover:bg-[var(--primary)] text-black flex items-center gap-2"><UserCog className="w-4 h-4" /> Profile</button><button onClick={handleLogout} className="w-full px-4 py-3 text-left font-semibold hover:bg-red-100 text-red-600 flex items-center gap-2"><LogOut className="w-4 h-4" /> Logout</button></div>}
          </div>
        </div>
      </RetroNavbar>

      <RetroContainer className="py-8">
        <div className="mb-8">
          <RetroHeading level={2} className="mb-2">Welcome back, {user?.name || user?.email}! 👋</RetroHeading>
          <p className="text-lg text-gray-600">Manage your interview rooms and schedule</p>
        </div>

        {/* Quick Action - Single New Interview button */}
        <div className="mb-10">
          <RetroCard className="p-6 cursor-pointer group" variant="primary" onClick={openCreateModal}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-2xl border-2 border-black flex items-center justify-center group-hover:rotate-3 transition-transform"><Plus className="w-8 h-8 text-black" /></div>
              <div><h3 className="font-bold text-xl text-black">New Interview</h3><p className="text-black opacity-70">Start now or schedule for later</p></div>
            </div>
          </RetroCard>
        </div>

        {/* My Rooms */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6"><RetroHeading level={3}>My Rooms</RetroHeading></div>
          {rooms.length === 0 ? <RetroEmptyState icon={Code2} title="No rooms yet" description="Create your first interview!" action={<RetroButton variant="primary" onClick={openCreateModal}><Plus className="w-4 h-4" /> New Interview</RetroButton>} /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{rooms.map(room => (
              <RetroCard key={room.id} className="p-5" hover={false}>
                <div className="flex items-center justify-between">
                  <div><h4 className="font-bold text-lg text-black">{room.name || 'Untitled Room'}</h4><div className="flex items-center gap-3 mt-2"><RetroBadge variant={statusVariants[room.status] || 'default'}>{room.status || 'waiting'}</RetroBadge><span className="text-sm text-gray-600">{room.language}</span></div></div>
                  <div className="flex gap-2"><RetroButton size="sm" variant="primary" onClick={() => navigate(`/room/${room.id}`)}><Play className="w-4 h-4" /> Join</RetroButton><RetroButton size="sm" variant="danger" onClick={() => deleteRoom(room.id)}><Trash2 className="w-4 h-4" /></RetroButton></div>
                </div>
              </RetroCard>
            ))}</div>
          )}
        </div>

        {/* Upcoming */}
        <div>
          <div className="flex justify-between items-center mb-6"><RetroHeading level={3}>Upcoming Interviews</RetroHeading><RetroButton size="sm" variant="outline" onClick={() => navigate('/schedule')}>View All</RetroButton></div>
          {schedules.length === 0 ? <RetroEmptyState icon={Calendar} title="No scheduled interviews" description="Schedule using 'New Interview'" action={<RetroButton variant="accent" onClick={openCreateModal}><Plus className="w-4 h-4" /> Schedule</RetroButton>} /> : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Interview Details</Table.Head>
                  <Table.Head>Date & Time</Table.Head>
                  <Table.Head>Duration</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {schedules.slice(0, 5).map(s => (
                  <Table.Row key={s.id}>
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[var(--accent)] rounded-lg border-2 border-black flex items-center justify-center">
                          <Clock className="w-4 h-4 text-black" />
                        </div>
                        <div>
                          <div className="font-bold">{s.title || 'Interview'}</div>
                          <div className="text-sm text-gray-600">{s.candidateEmail}</div>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="font-bold">{new Date(s.scheduledAt).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-600">{new Date(s.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </Table.Cell>
                    <Table.Cell>
                      <RetroBadge variant="default">{s.duration} min</RetroBadge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </div>
      </RetroContainer>

      {/* Create Room Modal - Unified Form */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <RetroCard className="w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black"><X className="w-5 h-5" /></button>
            <h2 className="font-bold text-2xl mb-6 text-black">New Interview</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold mb-2 text-black">Interview Title *</label>
                <input type="text" value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-black font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" placeholder="Frontend Interview - John Doe" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-black">Language</label>
                <select value={roomForm.language} onChange={(e) => setRoomForm({ ...roomForm, language: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-black font-bold cursor-pointer"><option value="javascript">JavaScript</option><option value="python">Python</option><option value="typescript">TypeScript</option></select>
              </div>

              {/* Schedule Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-black">
                <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-black" /><div><h4 className="font-bold text-black">Schedule for later</h4><p className="text-sm text-gray-600">Send invite to candidate</p></div></div>
                <RetroToggle checked={roomForm.scheduleForLater} onChange={(v) => setRoomForm({ ...roomForm, scheduleForLater: v })} />
              </div>

              {/* Scheduling Fields */}
              {roomForm.scheduleForLater && (
                <div className="space-y-4 p-4 bg-[var(--accent)] rounded-xl border-2 border-black">
                  <div><label className="block text-sm font-bold mb-2 text-black">Candidate Email *</label><input type="email" value={roomForm.candidateEmail} onChange={(e) => setRoomForm({ ...roomForm, candidateEmail: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-black" placeholder="candidate@example.com" /></div>
                  <div><label className="block text-sm font-bold mb-2 text-black">Date & Time *</label><input type="datetime-local" value={roomForm.scheduledAt} onChange={(e) => setRoomForm({ ...roomForm, scheduledAt: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-black" /></div>
                  <div><label className="block text-sm font-bold mb-2 text-black">Duration (minutes)</label><input type="number" value={roomForm.duration} onChange={(e) => setRoomForm({ ...roomForm, duration: parseInt(e.target.value) || 60 })} className="w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-black" /></div>
                </div>
              )}

              <div><label className="block text-sm font-bold mb-2 text-black">Notes (optional)</label><textarea value={roomForm.description} onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-black resize-none" rows={2} placeholder="Interview notes..." /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <RetroButton variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">Cancel</RetroButton>
              <RetroButton variant="primary" onClick={createRoom} disabled={creating} className="flex-1">{creating ? 'Creating...' : roomForm.scheduleForLater ? 'Schedule Interview' : 'Start Now'}</RetroButton>
            </div>
          </RetroCard>
        </div>
      )}
    </div>
  )
}
