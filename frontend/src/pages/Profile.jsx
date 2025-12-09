import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, ChevronLeft, Save, Mail, Settings, Bell, Moon, Calendar, FileQuestion, LogOut, Camera, X } from 'lucide-react'
import { RetroButton, RetroCard, RetroContainer, RetroNavbar, RetroHeading, RetroToggle, RetroInput } from '../components/RetroUI'
import { retroToast } from '../components/RetroToast'

// Helper function to get user initials
const getInitials = (name, email) => {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  if (email) {
    return email.substring(0, 2).toUpperCase()
  }
  return 'U'
}

// Avatar component with initials fallback and upload support
const ProfileAvatar = ({ user, profilePicture, onUpload, onRemove }) => {
  const fileInputRef = useRef(null)
  const initials = getInitials(user?.name, user?.email)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Convert to base64 for simple storage (in production, you'd upload to a CDN)
      const reader = new FileReader()
      reader.onloadend = () => {
        onUpload(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="relative group">
      <div className="w-28 h-28 bg-[var(--primary)] rounded-2xl border-2 border-black flex items-center justify-center overflow-hidden shadow-[0_4px_0_0_#000]">
        {profilePicture ? (
          <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl font-black text-black">{initials}</span>
        )}
      </div>
      
      {/* Upload overlay */}
      <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 bg-white rounded-full border-2 border-black flex items-center justify-center hover:bg-[var(--primary)] transition-colors"
          title="Upload photo"
        >
          <Camera className="w-5 h-5 text-black" />
        </button>
        {profilePicture && (
          <button
            onClick={onRemove}
            className="w-10 h-10 bg-white rounded-full border-2 border-black flex items-center justify-center hover:bg-red-100 transition-colors"
            title="Remove photo"
          >
            <X className="w-5 h-5 text-red-600" />
          </button>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}

export default function Profile() {
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', profilePicture: '' })
  const [preferences, setPreferences] = useState({ notifications: true, darkMode: false })
  const [saving, setSaving] = useState(false)
  const [loadingPrefs, setLoadingPrefs] = useState(true)
  const [message, setMessage] = useState({ text: '', type: '' })
  const navigate = useNavigate()

  // Initial load - get user from localStorage and fetch preferences from backend
  useEffect(() => {
    const loadUserData = async () => {
      const storedUser = localStorage.getItem('user')
      const token = localStorage.getItem('token')
      
      if (!storedUser || !token) {
        navigate('/login')
        return
      }
      
      const userData = JSON.parse(storedUser)
      setUser(userData)
      setForm({ 
        name: userData.name || '', 
        email: userData.email || '',
        profilePicture: userData.profilePicture || ''
      })

      // Fetch latest user data including preferences from backend
      try {
        const res = await fetch(`/api/users/${userData.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (res.ok) {
          const freshData = await res.json()
          setUser(freshData)
          setForm({
            name: freshData.name || '',
            email: freshData.email || '',
            profilePicture: freshData.profilePicture || ''
          })
          
          // Load preferences from backend
          if (freshData.preferences) {
            setPreferences({
              notifications: freshData.preferences.notifications ?? true,
              darkMode: freshData.preferences.darkMode ?? false
            })
          }
          
          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(freshData))
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err)
      } finally {
        setLoadingPrefs(false)
      }
    }

    loadUserData()
  }, [navigate])

  const handleProfilePictureUpload = (imageData) => {
    setForm({ ...form, profilePicture: imageData })
  }

  const handleProfilePictureRemove = () => {
    setForm({ ...form, profilePicture: '' })
  }

  const handleSave = async () => {
    const token = localStorage.getItem('token')
    setSaving(true)
    
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })
      
      if (res.ok) {
        const updated = await res.json()
        const updatedUser = { ...user, ...updated }
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
        retroToast.success('Profile updated successfully!')
      } else {
        const error = await res.json()
        retroToast.error(error.error || 'Failed to update profile')
      }
    } catch (err) {
      retroToast.error('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  const handlePreferences = async () => {
    const token = localStorage.getItem('token')
    
    try {
      const res = await fetch(`/api/users/${user.id}/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferences)
      })
      
      if (res.ok) {
        const updated = await res.json()
        // Update user in localStorage with new preferences
        const updatedUser = { ...user, preferences: updated.preferences }
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
        retroToast.success('Preferences saved!')
      } else {
        retroToast.error('Failed to save preferences')
      }
    } catch (err) {
      console.error(err)
      retroToast.error('An error occurred')
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-white">
      <RetroNavbar>
        <div className="flex items-center gap-4">
          <RetroButton variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ChevronLeft className="w-4 h-4" /> Back
          </RetroButton>
          <div className="flex items-center gap-2 font-black text-xl text-black">
            <Settings className="w-6 h-6" /> Profile
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/questions" className="font-semibold text-black hover:text-gray-600 flex items-center gap-1">
            <FileQuestion className="w-4 h-4" /> Questions
          </Link>
          <Link to="/schedule" className="font-semibold text-black hover:text-gray-600 flex items-center gap-1">
            <Calendar className="w-4 h-4" /> Schedule
          </Link>
          <RetroButton variant="danger" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Logout
          </RetroButton>
        </div>
      </RetroNavbar>

      <RetroContainer size="md" className="py-8">
        {/* Profile Header Card */}
        <RetroCard className="p-8 mb-8">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b-2 border-gray-200">
            <ProfileAvatar 
              user={user}
              profilePicture={form.profilePicture}
              onUpload={handleProfilePictureUpload}
              onRemove={handleProfilePictureRemove}
            />
            <div>
              <RetroHeading level={3}>{user.name || 'User'}</RetroHeading>
              <p className="text-gray-600 font-medium">{user.email}</p>
              {user.role && (
                <span className="inline-flex items-center px-3 py-1 mt-2 text-xs font-bold rounded-full border border-black bg-[var(--accent)] text-black">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              )}
            </div>
          </div>

          <RetroHeading level={4} className="mb-6">Account Information</RetroHeading>
          
          <div className="space-y-5">
            <RetroInput
              label="Name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
            />
            
            <RetroInput
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="your@email.com"
            />

            {message.text && (
              <div className={`p-4 rounded-lg border-2 font-bold ${
                message.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                  : 'bg-red-50 border-red-500 text-red-600'
              }`}>
                {message.text}
              </div>
            )}

            <RetroButton 
              variant="primary" 
              size="lg" 
              onClick={handleSave} 
              disabled={saving}
              className="w-full md:w-auto"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </RetroButton>
          </div>
        </RetroCard>

        {/* Preferences Card */}
        <RetroCard className="p-8">
          <RetroHeading level={4} className="mb-6">Preferences</RetroHeading>
          
          {loadingPrefs ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              <span className="ml-3 font-medium text-gray-600">Loading preferences...</span>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-black">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--accent)] rounded-xl border-2 border-black flex items-center justify-center">
                    <Bell className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h4 className="font-bold text-black">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive interview reminders and updates</p>
                  </div>
                </div>
                <RetroToggle 
                  checked={preferences.notifications} 
                  onChange={(v) => setPreferences({ ...preferences, notifications: v })} 
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-black">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--primary)] rounded-xl border-2 border-black flex items-center justify-center">
                    <Moon className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h4 className="font-bold text-black">Dark Mode</h4>
                    <p className="text-sm text-gray-600">Coming soon</p>
                  </div>
                </div>
                <RetroToggle 
                  checked={preferences.darkMode} 
                  onChange={(v) => setPreferences({ ...preferences, darkMode: v })} 
                />
              </div>

              <RetroButton variant="outline" onClick={handlePreferences}>
                Save Preferences
              </RetroButton>
            </div>
          )}
        </RetroCard>
      </RetroContainer>
    </div>
  )
}
