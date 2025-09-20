'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, Product, UserBalance } from '@/types/product'
import Link from 'next/link'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'user' as 'admin' | 'user',
    profile: {
      organization: '',
      phone: '',
      location: ''
    }
  })
  const [allocation, setAllocation] = useState({
    userId: '',
    productId: '',
    quantity: 0,
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'allocation'>('users')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (session.user.role !== 'admin') {
      router.push('/')
      return
    }
    fetchUsers()
    fetchProducts()
  }, [session, status, router])

  async function fetchUsers() {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to fetch users')
        return
      }

      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Failed to fetch users')
      setUsers([])
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      setError('Failed to fetch products')
    }
  }

  async function createUser() {
    if (!newUser.name || !newUser.email) {
      setError('Name and email are required')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })

      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to create user')
        return
      }

      setNewUser({
        name: '',
        email: '',
        role: 'user',
        profile: {
          organization: '',
          phone: '',
          location: ''
        }
      })
      fetchUsers()
    } catch (err) {
      setError('Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  async function allocateStock() {
    if (!allocation.userId || !allocation.productId || !allocation.quantity) {
      setError('User, product, and quantity are required')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/user-balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allocation)
      })

      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to allocate stock')
        return
      }

      setAllocation({
        userId: '',
        productId: '',
        quantity: 0,
        notes: ''
      })
      fetchProducts() // Refresh to see updated stock levels
    } catch (err) {
      setError('Failed to allocate stock')
    } finally {
      setLoading(false)
    }
  }

  async function toggleUserStatus(userId: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (res.ok) {
        fetchUsers()
      }
    } catch (err) {
      setError('Failed to update user status')
    }
  }

  if (status === 'loading') return <div>Loading...</div>
  if (!session || session.user.role !== 'admin') return null

  const selectedProduct = products.find(p => p._id === allocation.productId)

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>⚙️ Admin Dashboard</h1>
          <div style={{ marginTop: '10px' }}>
            <Link href="/" style={{ marginRight: '15px', color: '#007cba', textDecoration: 'none' }}>📦 Inventory</Link>
            <Link href="/workshops" style={{ marginRight: '15px', color: '#007cba', textDecoration: 'none' }}>🎪 Workshops</Link>
            <Link href="/distributions" style={{ marginRight: '15px', color: '#007cba', textDecoration: 'none' }}>📋 Distributions</Link>
            <Link href="/reports" style={{ marginRight: '15px', color: '#007cba', textDecoration: 'none' }}>📊 Reports</Link>
            <span style={{ color: '#007cba', fontWeight: 'bold' }}>⚙️ Admin</span>
          </div>
        </div>
        <div>
          <span>Welcome, {session.user?.name} (Admin)</span>
          <button onClick={() => signOut()} style={{ marginLeft: '10px', padding: '5px 10px' }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'users' ? '2px solid #007cba' : 'none',
            backgroundColor: 'transparent',
            color: activeTab === 'users' ? '#007cba' : '#666',
            cursor: 'pointer'
          }}
        >
          👥 User Management
        </button>
        <button
          onClick={() => setActiveTab('allocation')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'allocation' ? '2px solid #007cba' : 'none',
            backgroundColor: 'transparent',
            color: activeTab === 'allocation' ? '#007cba' : '#666',
            cursor: 'pointer'
          }}
        >
          📤 Stock Allocation
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          {/* Create User Form */}
          <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
            <h3>Create New User</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', alignItems: 'end' }}>
              <input
                placeholder="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={loading}
              />
              <input
                placeholder="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={loading}
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'user' })}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={loading}
              >
                <option value="user">👤 Regular User</option>
                <option value="admin">⚙️ Admin</option>
              </select>
              <input
                placeholder="Organization"
                value={newUser.profile.organization}
                onChange={(e) => setNewUser({ ...newUser, profile: { ...newUser.profile, organization: e.target.value } })}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={loading}
              />
              <button
                onClick={createUser}
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
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#666', margin: '10px 0 0 0' }}>
              Default password: "password" (users can change this later)
            </p>
          </div>

          {/* Users Table */}
          <h3>System Users</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ border: '1px solid #ccc', padding: '10px' }}>Name</th>
                <th style={{ border: '1px solid #ccc', padding: '10px' }}>Email</th>
                <th style={{ border: '1px solid #ccc', padding: '10px' }}>Role</th>
                <th style={{ border: '1px solid #ccc', padding: '10px' }}>Organization</th>
                <th style={{ border: '1px solid #ccc', padding: '10px' }}>Status</th>
                <th style={{ border: '1px solid #ccc', padding: '10px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(users) && users.map((user) => (
                <tr key={user._id}>
                  <td style={{ border: '1px solid #ccc', padding: '10px' }}>{user.name}</td>
                  <td style={{ border: '1px solid #ccc', padding: '10px' }}>{user.email}</td>
                  <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                    {user.role === 'admin' ? '⚙️ Admin' : '👤 User'}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '10px' }}>{user.profile?.organization || 'N/A'}</td>
                  <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                    <span style={{ color: user.isActive ? '#16a34a' : '#dc2626' }}>
                      {user.isActive ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                    <button
                      onClick={() => toggleUserStatus(user._id!, user.isActive)}
                      style={{
                        padding: '3px 6px',
                        backgroundColor: user.isActive ? '#dc2626' : '#16a34a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'allocation' && (
        <div>
          {/* Stock Allocation Form */}
          <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
            <h3>Allocate Materials to User</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', alignItems: 'end' }}>
              <select
                value={allocation.userId}
                onChange={(e) => setAllocation({ ...allocation, userId: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={loading}
              >
                <option value="">Select User</option>
                {users.filter(u => u.isActive && u.role === 'user').map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              <select
                value={allocation.productId}
                onChange={(e) => setAllocation({ ...allocation, productId: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={loading}
              >
                <option value="">Select Product</option>
                {products.filter(p => p.stock > 0).map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} (Available: {product.stock})
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Quantity"
                value={allocation.quantity}
                max={selectedProduct?.stock || 0}
                onChange={(e) => setAllocation({ ...allocation, quantity: parseInt(e.target.value) || 0 })}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={loading}
              />
              <input
                placeholder="Notes (optional)"
                value={allocation.notes}
                onChange={(e) => setAllocation({ ...allocation, notes: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                disabled={loading}
              />
              <button
                onClick={allocateStock}
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
                {loading ? 'Allocating...' : 'Allocate Stock'}
              </button>
            </div>
            {selectedProduct && (
              <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
                Available in main stock: {selectedProduct.stock} {selectedProduct.name}
              </p>
            )}
          </div>

          {/* Current Stock Levels */}
          <h3>Main Stock Levels</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {products.map((product) => (
              <div key={product._id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>{product.name}</h4>
                <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: product.stock < 10 ? '#dc2626' : '#16a34a' }}>
                  {product.stock} units
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                  {product.category === 'materials' ? '📦 Materials' : '🍪 Refreshments'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}