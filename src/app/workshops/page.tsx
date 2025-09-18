'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Workshop } from '@/types/product'
import Link from 'next/link'

export default function WorkshopsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [newWorkshop, setNewWorkshop] = useState({
    title: '',
    date: '',
    participants: 0,
    status: 'planned' as 'planned' | 'completed',
    notes: ''
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchWorkshops()
  }, [session, status, router])

  async function fetchWorkshops() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/workshops')
      const data = await res.json()
      setWorkshops(data)
    } catch (err) {
      setError('Failed to fetch workshops')
    } finally {
      setLoading(false)
    }
  }

  async function addWorkshop() {
    if (!newWorkshop.title || !newWorkshop.date) {
      setError('Title and date are required')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/workshops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkshop)
      })

      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to add workshop')
        return
      }

      setNewWorkshop({ title: '', date: '', participants: 0, status: 'planned', notes: '' })
      fetchWorkshops()
    } catch (err) {
      setError('Failed to add workshop')
    } finally {
      setLoading(false)
    }
  }

  async function updateWorkshop(id: string, workshop: Workshop) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/workshops/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workshop)
      })

      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to update workshop')
        return
      }

      setEditingId(null)
      fetchWorkshops()
    } catch (err) {
      setError('Failed to update workshop')
    } finally {
      setLoading(false)
    }
  }

  async function deleteWorkshop(id: string) {
    if (!confirm('Are you sure you want to delete this workshop?')) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/workshops/${id}`, { method: 'DELETE' })

      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to delete workshop')
        return
      }

      fetchWorkshops()
    } catch (err) {
      setError('Failed to delete workshop')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') return <div>Loading...</div>
  if (!session) return null

  const plannedWorkshops = workshops.filter(w => w.status === 'planned')
  const completedWorkshops = workshops.filter(w => w.status === 'completed')

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>🎪 Workshop Management</h1>
          <div style={{ marginTop: '10px' }}>
            <Link href="/" style={{ marginRight: '15px', color: '#007cba', textDecoration: 'none' }}>📦 Inventory</Link>
            <span style={{ color: '#007cba', fontWeight: 'bold' }}>🎪 Workshops</span>
          </div>
        </div>
        <div>
          <span>Welcome, {session.user?.email}</span>
          <button onClick={() => signOut()} style={{ marginLeft: '10px', padding: '5px 10px' }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Workshop Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #e0e7ff' }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#1e40af' }}>📅 Planned</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#1e40af' }}>{plannedWorkshops.length}</p>
        </div>
        <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#166534' }}>✅ Completed</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#166534' }}>{completedWorkshops.length}</p>
        </div>
        <div style={{ background: '#fef7f0', padding: '15px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#ea580c' }}>👥 Participants</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#ea580c' }}>
            {workshops.reduce((sum, w) => sum + w.participants, 0)}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Add Workshop Form */}
      <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
        <h3>Schedule New Workshop</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', alignItems: 'end' }}>
          <input
            placeholder="Workshop Title"
            value={newWorkshop.title}
            onChange={(e) => setNewWorkshop({ ...newWorkshop, title: e.target.value })}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            disabled={loading}
          />
          <input
            type="date"
            value={newWorkshop.date}
            onChange={(e) => setNewWorkshop({ ...newWorkshop, date: e.target.value })}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            disabled={loading}
          />
          <input
            type="number"
            placeholder="Expected Participants"
            value={newWorkshop.participants}
            onChange={(e) => setNewWorkshop({ ...newWorkshop, participants: parseInt(e.target.value) || 0 })}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            disabled={loading}
          />
          <button
            onClick={addWorkshop}
            disabled={loading}
            style={{
              padding: '8px 15px',
              backgroundColor: loading ? '#ccc' : '#007cba',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Adding...' : 'Add Workshop'}
          </button>
        </div>
      </div>

      {/* Workshops Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>Title</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>Date</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>Participants</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>Status</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {workshops.map((workshop) => (
            <tr key={workshop._id}>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                {editingId === workshop._id ? (
                  <input
                    value={workshop.title}
                    onChange={(e) => setWorkshops(workshops.map(w =>
                      w._id === workshop._id ? { ...w, title: e.target.value } : w
                    ))}
                  />
                ) : workshop.title}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                {editingId === workshop._id ? (
                  <input
                    type="date"
                    value={workshop.date}
                    onChange={(e) => setWorkshops(workshops.map(w =>
                      w._id === workshop._id ? { ...w, date: e.target.value } : w
                    ))}
                  />
                ) : workshop.date}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                {editingId === workshop._id ? (
                  <input
                    type="number"
                    value={workshop.participants}
                    onChange={(e) => setWorkshops(workshops.map(w =>
                      w._id === workshop._id ? { ...w, participants: parseInt(e.target.value) || 0 } : w
                    ))}
                  />
                ) : workshop.participants}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                {editingId === workshop._id ? (
                  <select
                    value={workshop.status}
                    onChange={(e) => setWorkshops(workshops.map(w =>
                      w._id === workshop._id ? { ...w, status: e.target.value as 'planned' | 'completed' } : w
                    ))}
                  >
                    <option value="planned">📅 Planned</option>
                    <option value="completed">✅ Completed</option>
                  </select>
                ) : (
                  <span>{workshop.status === 'planned' ? '📅 Planned' : '✅ Completed'}</span>
                )}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                {editingId === workshop._id ? (
                  <>
                    <button
                      onClick={() => updateWorkshop(workshop._id!, workshop)}
                      disabled={loading}
                      style={{
                        margin: '2px',
                        padding: '3px 6px',
                        backgroundColor: loading ? '#ccc' : '#007cba',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{
                        margin: '2px',
                        padding: '3px 6px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px'
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingId(workshop._id!)}
                      disabled={loading}
                      style={{
                        margin: '2px',
                        padding: '3px 6px',
                        backgroundColor: loading ? '#ccc' : '#16a34a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteWorkshop(workshop._id!)}
                      disabled={loading}
                      style={{
                        margin: '2px',
                        padding: '3px 6px',
                        backgroundColor: loading ? '#ccc' : '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!loading && workshops.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No workshops scheduled yet. Add your first workshop above!
        </div>
      )}
    </div>
  )
}