import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Code2, Plus, FileQuestion, Search, Edit, Trash2, ChevronLeft, Calendar, Settings, LogOut, UserCog, ChevronDown } from 'lucide-react'
import { RetroButton, RetroCard, RetroContainer, RetroNavbar, RetroHeading, RetroBadge, RetroEmptyState } from '../components/RetroUI'

export default function Questions() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', difficulty: 'medium', category: '' })
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { fetchQuestions() }, [difficulty])

  const fetchQuestions = async () => {
    try { const params = new URLSearchParams(); if (difficulty) params.append('difficulty', difficulty); const res = await fetch(`/api/questions?${params}`); if (res.ok) setQuestions(await res.json()) } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    const token = localStorage.getItem('token')
    if (!token) { alert('Please login'); navigate('/login'); return }
    try { const res = await fetch(editingId ? `/api/questions/${editingId}` : '/api/questions', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(form) }); if (res.ok) { setShowForm(false); setEditingId(null); setForm({ title: '', description: '', difficulty: 'medium', category: '' }); fetchQuestions() } } catch (err) { alert('Failed') }
  }

  const handleEdit = (q) => { setForm({ title: q.title, description: q.description, difficulty: q.difficulty, category: q.category || '' }); setEditingId(q.id); setShowForm(true) }
  const handleDelete = async (id) => { if (!confirm('Delete?')) return; await fetch(`/api/questions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }); setQuestions(questions.filter(q => q.id !== id)) }
  const handleLogout = () => { localStorage.clear(); navigate('/') }

  const filtered = questions.filter(q => q.title.toLowerCase().includes(search.toLowerCase()))
  const difficultyVariants = { easy: 'success', medium: 'warning', hard: 'destructive' }

  return (
    <div className="min-h-screen bg-white">
      <RetroNavbar>
        <div className="flex items-center gap-4">
          <RetroButton variant="ghost" size="sm" onClick={() => navigate('/dashboard')}><ChevronLeft className="w-4 h-4" /> Back</RetroButton>
          <div className="flex items-center gap-2 font-black text-xl text-black"><FileQuestion className="w-6 h-6" /> Questions</div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/schedule" className="font-semibold text-black hover:text-gray-600 flex items-center gap-1"><Calendar className="w-4 h-4" /> Schedule</Link>
          <div className="relative">
            <RetroButton variant="outline" size="sm" onClick={() => setMenuOpen(!menuOpen)}><Settings className="w-4 h-4" /><ChevronDown className="w-4 h-4" /></RetroButton>
            {menuOpen && <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border-2 border-black shadow-xl overflow-hidden z-50"><button onClick={() => { navigate('/profile'); setMenuOpen(false) }} className="w-full px-4 py-3 text-left font-semibold hover:bg-[var(--primary)] text-black flex items-center gap-2"><UserCog className="w-4 h-4" /> Profile</button><button onClick={handleLogout} className="w-full px-4 py-3 text-left font-semibold hover:bg-red-100 text-red-600 flex items-center gap-2"><LogOut className="w-4 h-4" /> Logout</button></div>}
          </div>
        </div>
      </RetroNavbar>

      <RetroContainer className="py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <RetroHeading level={2}>Questions Library</RetroHeading>
          <RetroButton onClick={() => { setEditingId(null); setForm({ title: '', description: '', difficulty: 'medium', category: '' }); setShowForm(true) }}><Plus className="w-4 h-4" /> Add Question</RetroButton>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-4 py-3 pl-12 rounded-lg border-2 border-black bg-white text-black font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="px-4 py-3 rounded-lg border-2 border-black bg-white text-black font-bold cursor-pointer focus:outline-none"><option value="">All</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
        </div>

        {loading ? <div className="text-center py-12 font-bold text-black">Loading...</div> : filtered.length === 0 ? <RetroEmptyState icon={FileQuestion} title="No questions" description="Add your first problem!" action={<RetroButton onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Add</RetroButton>} /> : (
          <div className="space-y-4">{filtered.map(q => (
            <RetroCard key={q.id} className="p-5" hover={false}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2"><h3 className="font-bold text-lg text-black">{q.title}</h3><RetroBadge variant={difficultyVariants[q.difficulty]}>{q.difficulty}</RetroBadge>{q.category && <RetroBadge variant="default">{q.category}</RetroBadge>}</div>
                  <p className="text-gray-600 line-clamp-2">{q.description}</p>
                </div>
                <div className="flex gap-2"><RetroButton size="sm" variant="outline" onClick={() => handleEdit(q)}><Edit className="w-4 h-4" /> Edit</RetroButton><RetroButton size="sm" variant="danger" onClick={() => handleDelete(q.id)}><Trash2 className="w-4 h-4" /></RetroButton></div>
              </div>
            </RetroCard>
          ))}</div>
        )}
      </RetroContainer>

      {showForm && <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><RetroCard className="w-full max-w-lg p-6">
        <h2 className="font-bold text-2xl mb-6 text-black">{editingId ? 'Edit' : 'Add'} Question</h2>
        <div className="space-y-4">
          <div><label className="block text-sm font-bold mb-2 text-black">Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-black" placeholder="Two Sum..." /></div>
          <div><label className="block text-sm font-bold mb-2 text-black">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-black resize-none" rows={4} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold mb-2 text-black">Difficulty</label><select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-black font-bold"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
            <div><label className="block text-sm font-bold mb-2 text-black">Category</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 rounded-lg border-2 border-black bg-white text-black" placeholder="Arrays..." /></div>
          </div>
        </div>
        <div className="flex gap-3 mt-6"><RetroButton variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</RetroButton><RetroButton variant="primary" onClick={handleSubmit} className="flex-1">{editingId ? 'Save' : 'Create'}</RetroButton></div>
      </RetroCard></div>}
    </div>
  )
}
