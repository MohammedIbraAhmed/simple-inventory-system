'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Workshop, Participant, UserBalance, Product } from '@/types/product'
import Link from 'next/link'

export default function WorkshopsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [userBalances, setUserBalances] = useState<UserBalance[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null)
  const [newWorkshop, setNewWorkshop] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    expectedParticipants: 0,
    status: 'planned' as 'planned' | 'ongoing' | 'completed' | 'cancelled'
  })
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    age: 0,
    phoneNumber: '',
    specialStatus: {
      isDisabled: false,
      isWounded: false,
      isSeparated: false,
      isUnaccompanied: false
    }
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'workshops' | 'participants' | 'materials'>('workshops')
  const [selectedParticipantForDistribution, setSelectedParticipantForDistribution] = useState<string | null>(null)
  const [materialDistribution, setMaterialDistribution] = useState({
    productId: '',
    quantity: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchWorkshops()
    fetchParticipants()
    fetchUserBalances()
    fetchProducts()
  }, [session, status, router])

  useEffect(() => {
    if (selectedWorkshopId) {
      fetchParticipants()
    }
  }, [selectedWorkshopId])

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

  async function fetchParticipants() {
    try {
      const url = selectedWorkshopId ? `/api/participants?workshopId=${selectedWorkshopId}` : '/api/participants'
      const res = await fetch(url)
      const data = await res.json()
      setParticipants(data)
    } catch (err) {
      // Silent fail for participants
    }
  }

  async function fetchUserBalances() {
    try {
      const res = await fetch('/api/user-balances')
      const data = await res.json()
      setUserBalances(data)
    } catch (err) {
      // Silent fail for user balances
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      // Silent fail for products
    }
  }

  async function addWorkshop() {
    if (!newWorkshop.title || !newWorkshop.date || !newWorkshop.startTime || !newWorkshop.endTime || !newWorkshop.location) {
      setError('Title, date, start time, end time, and location are required')
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

      setNewWorkshop({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        expectedParticipants: 0,
        status: 'planned'
      })
      fetchWorkshops()
    } catch (err) {
      setError('Failed to add workshop')
    } finally {
      setLoading(false)
    }
  }

  async function addParticipant() {
    if (!selectedWorkshopId || !newParticipant.name || !newParticipant.age || !newParticipant.phoneNumber) {
      setError('Please select a workshop and fill in all required participant fields')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshopId: selectedWorkshopId,
          ...newParticipant
        })
      })

      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to add participant')
        return
      }

      setNewParticipant({
        name: '',
        age: 0,
        phoneNumber: '',
        specialStatus: {
          isDisabled: false,
          isWounded: false,
          isSeparated: false,
          isUnaccompanied: false
        }
      })
      fetchParticipants()
    } catch (err) {
      setError('Failed to add participant')
    } finally {
      setLoading(false)
    }
  }

  async function distributeMaterial() {
    if (!selectedParticipantForDistribution || !materialDistribution.productId || !materialDistribution.quantity || !selectedWorkshopId) {
      setError('Please select participant, product, quantity, and ensure workshop is selected')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/distribute-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: selectedParticipantForDistribution,
          productId: materialDistribution.productId,
          quantity: materialDistribution.quantity,
          workshopId: selectedWorkshopId
        })
      })

      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to distribute materials')
        return
      }

      setMaterialDistribution({ productId: '', quantity: 0 })
      setSelectedParticipantForDistribution(null)
      fetchUserBalances()
      fetchParticipants()
    } catch (err) {
      setError('Failed to distribute materials')
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
  const totalParticipants = workshops.reduce((sum, w) => sum + (w.actualParticipants || 0), 0)

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">🎪 Workshop Management</h1>
        <p className="text-muted-foreground">
          Create, manage, and track workshops and participant registrations
        </p>
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
            {totalParticipants}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc' }}>
        <button
          onClick={() => setActiveTab('workshops')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'workshops' ? '2px solid #007cba' : 'none',
            backgroundColor: 'transparent',
            color: activeTab === 'workshops' ? '#007cba' : '#666',
            cursor: 'pointer'
          }}
        >
          🎪 Workshops
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'participants' ? '2px solid #007cba' : 'none',
            backgroundColor: 'transparent',
            color: activeTab === 'participants' ? '#007cba' : '#666',
            cursor: 'pointer'
          }}
        >
          👥 Participants
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'materials' ? '2px solid #007cba' : 'none',
            backgroundColor: 'transparent',
            color: activeTab === 'materials' ? '#007cba' : '#666',
            cursor: 'pointer'
          }}
        >
          📦 Material Distribution
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {activeTab === 'workshops' && (
        <div>
          {/* Add Workshop Form */}
          <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
            <h3>Schedule New Workshop</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', alignItems: 'end' }}>
              <input
                placeholder="Workshop Title"
                value={newWorkshop.title}
                onChange={(e) => setNewWorkshop({ ...newWorkshop, title: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={loading}
              />
              <textarea
                placeholder="Description"
                value={newWorkshop.description}
                onChange={(e) => setNewWorkshop({ ...newWorkshop, description: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '60px' }}
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
                type="time"
                placeholder="Start Time"
                value={newWorkshop.startTime}
                onChange={(e) => setNewWorkshop({ ...newWorkshop, startTime: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={loading}
              />
              <input
                type="time"
                placeholder="End Time"
                value={newWorkshop.endTime}
                onChange={(e) => setNewWorkshop({ ...newWorkshop, endTime: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={loading}
              />
              <input
                placeholder="Location"
                value={newWorkshop.location}
                onChange={(e) => setNewWorkshop({ ...newWorkshop, location: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={loading}
              />
              <input
                type="number"
                placeholder="Expected Participants"
                value={newWorkshop.expectedParticipants}
                onChange={(e) => setNewWorkshop({ ...newWorkshop, expectedParticipants: parseInt(e.target.value) || 0 })}
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
                    value={workshop.actualParticipants}
                    onChange={(e) => setWorkshops(workshops.map(w =>
                      w._id === workshop._id ? { ...w, actualParticipants: parseInt(e.target.value) || 0 } : w
                    ))}
                  />
                ) : workshop.actualParticipants}
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
      )}

      {activeTab === 'participants' && (
        <div>
          {/* Workshop Selection */}
          <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
            <h3>Select Workshop to Manage Participants</h3>
            <select
              value={selectedWorkshopId || ''}
              onChange={(e) => setSelectedWorkshopId(e.target.value || null)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px' }}
            >
              <option value="">Choose a workshop...</option>
              {workshops.map((workshop) => (
                <option key={workshop._id} value={workshop._id}>
                  {workshop.title} - {workshop.date} at {workshop.location}
                </option>
              ))}
            </select>
          </div>

          {selectedWorkshopId && (
            <>
              {/* Add Participant Form */}
              <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                <h3>Register New Participant</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', alignItems: 'end' }}>
                  <input
                    placeholder="Full Name"
                    value={newParticipant.name}
                    onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    disabled={loading}
                  />
                  <input
                    type="number"
                    placeholder="Age"
                    value={newParticipant.age}
                    onChange={(e) => setNewParticipant({ ...newParticipant, age: parseInt(e.target.value) || 0 })}
                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    disabled={loading}
                  />
                  <input
                    placeholder="Phone Number"
                    value={newParticipant.phoneNumber}
                    onChange={(e) => setNewParticipant({ ...newParticipant, phoneNumber: e.target.value })}
                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    disabled={loading}
                  />
                  <button
                    onClick={addParticipant}
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
                    {loading ? 'Adding...' : 'Add Participant'}
                  </button>
                </div>

                {/* Special Status Checkboxes */}
                <div style={{ marginTop: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>Special Status (check if applicable):</h4>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="checkbox"
                        checked={newParticipant.specialStatus.isDisabled}
                        onChange={(e) => setNewParticipant({
                          ...newParticipant,
                          specialStatus: { ...newParticipant.specialStatus, isDisabled: e.target.checked }
                        })}
                        disabled={loading}
                      />
                      🦽 Disabled
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="checkbox"
                        checked={newParticipant.specialStatus.isWounded}
                        onChange={(e) => setNewParticipant({
                          ...newParticipant,
                          specialStatus: { ...newParticipant.specialStatus, isWounded: e.target.checked }
                        })}
                        disabled={loading}
                      />
                      🩹 Wounded
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="checkbox"
                        checked={newParticipant.specialStatus.isSeparated}
                        onChange={(e) => setNewParticipant({
                          ...newParticipant,
                          specialStatus: { ...newParticipant.specialStatus, isSeparated: e.target.checked }
                        })}
                        disabled={loading}
                      />
                      💔 Separated
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="checkbox"
                        checked={newParticipant.specialStatus.isUnaccompanied}
                        onChange={(e) => setNewParticipant({
                          ...newParticipant,
                          specialStatus: { ...newParticipant.specialStatus, isUnaccompanied: e.target.checked }
                        })}
                        disabled={loading}
                      />
                      👤 Unaccompanied
                    </label>
                  </div>
                </div>
              </div>

              {/* Participants List */}
              <div>
                <h3>Registered Participants ({participants.length})</h3>
                {participants.length > 0 ? (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {participants.map((participant) => (
                      <div key={participant._id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div>
                            <h4 style={{ margin: '0 0 5px 0' }}>{participant.name}</h4>
                            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
                              Age: {participant.age} | Phone: {participant.phoneNumber}
                            </p>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                              {participant.specialStatus.isDisabled && <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>🦽 Disabled</span>}
                              {participant.specialStatus.isWounded && <span style={{ background: '#fef2f2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>🩹 Wounded</span>}
                              {participant.specialStatus.isSeparated && <span style={{ background: '#fef7f0', color: '#9a3412', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>💔 Separated</span>}
                              {participant.specialStatus.isUnaccompanied && <span style={{ background: '#f0fdf4', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>👤 Unaccompanied</span>}
                            </div>
                            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                              Status: <span style={{ color: participant.attendanceStatus === 'attended' ? '#16a34a' : participant.attendanceStatus === 'no-show' ? '#dc2626' : '#ea580c' }}>
                                {participant.attendanceStatus === 'registered' ? '📝 Registered' :
                                 participant.attendanceStatus === 'attended' ? '✅ Attended' : '❌ No Show'}
                              </span>
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#16a34a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666', border: '1px solid #ddd', borderRadius: '8px' }}>
                    No participants registered yet. Add the first participant above!
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'materials' && (
        <div>
          {/* Workshop Selection for Materials */}
          <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
            <h3>Select Workshop for Material Distribution</h3>
            <select
              value={selectedWorkshopId || ''}
              onChange={(e) => setSelectedWorkshopId(e.target.value || null)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px' }}
            >
              <option value="">Choose a workshop...</option>
              {workshops.map((workshop) => (
                <option key={workshop._id} value={workshop._id}>
                  {workshop.title} - {workshop.date} at {workshop.location}
                </option>
              ))}
            </select>
          </div>

          {selectedWorkshopId && (
            <>
              {/* My Available Materials */}
              <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                <h3>📦 My Available Materials</h3>
                {userBalances.filter(b => b.availableQuantity > 0).length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    {userBalances.filter(b => b.availableQuantity > 0).map((balance) => (
                      <div key={balance._id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>{balance.productName}</h4>
                        <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                          Available: <span style={{ fontWeight: 'bold', color: '#16a34a' }}>{balance.availableQuantity}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666', border: '1px solid #ddd', borderRadius: '8px' }}>
                    No materials available for distribution. Contact admin to get materials allocated.
                  </div>
                )}
              </div>

              {/* Material Distribution Form */}
              {userBalances.filter(b => b.availableQuantity > 0).length > 0 && participants.length > 0 && (
                <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                  <h3>🎯 Distribute Materials to Participant</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', alignItems: 'end' }}>
                    <select
                      value={selectedParticipantForDistribution || ''}
                      onChange={(e) => setSelectedParticipantForDistribution(e.target.value || null)}
                      style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                      disabled={loading}
                    >
                      <option value="">Select Participant</option>
                      {participants.map((participant) => (
                        <option key={participant._id} value={participant._id}>
                          {participant.name} (Age: {participant.age})
                        </option>
                      ))}
                    </select>
                    <select
                      value={materialDistribution.productId}
                      onChange={(e) => setMaterialDistribution({ ...materialDistribution, productId: e.target.value })}
                      style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                      disabled={loading}
                    >
                      <option value="">Select Material</option>
                      {userBalances.filter(b => b.availableQuantity > 0).map((balance) => (
                        <option key={balance.productId} value={balance.productId}>
                          {balance.productName} (Available: {balance.availableQuantity})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={materialDistribution.quantity}
                      max={userBalances.find(b => b.productId === materialDistribution.productId)?.availableQuantity || 0}
                      onChange={(e) => setMaterialDistribution({ ...materialDistribution, quantity: parseInt(e.target.value) || 0 })}
                      style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                      disabled={loading}
                    />
                    <button
                      onClick={distributeMaterial}
                      disabled={loading || !selectedParticipantForDistribution || !materialDistribution.productId || !materialDistribution.quantity}
                      style={{
                        padding: '8px 15px',
                        backgroundColor: loading ? '#ccc' : '#007cba',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {loading ? 'Distributing...' : 'Distribute Material'}
                    </button>
                  </div>
                  {materialDistribution.productId && (
                    <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
                      Available: {userBalances.find(b => b.productId === materialDistribution.productId)?.availableQuantity || 0} units
                    </p>
                  )}
                </div>
              )}

              {/* Participants with Materials Received */}
              <div>
                <h3>👥 Participants & Distributed Materials</h3>
                {participants.length > 0 ? (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {participants.map((participant) => (
                      <div key={participant._id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 5px 0' }}>{participant.name}</h4>
                            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
                              Age: {participant.age} | Phone: {participant.phoneNumber}
                            </p>

                            {/* Materials Received */}
                            {participant.materialsReceived && participant.materialsReceived.length > 0 ? (
                              <div>
                                <h5 style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#374151' }}>Materials Received:</h5>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  {participant.materialsReceived.map((material, index) => (
                                    <span key={index} style={{
                                      background: '#e0f2fe',
                                      color: '#0369a1',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontSize: '12px'
                                    }}>
                                      {material.productName}: {material.quantity}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p style={{ margin: '0', fontSize: '12px', color: '#9ca3af' }}>No materials distributed yet</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666', border: '1px solid #ddd', borderRadius: '8px' }}>
                    No participants registered for this workshop yet.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}