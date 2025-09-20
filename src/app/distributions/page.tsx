'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Product, Distribution } from '@/types/product'
import Link from 'next/link'

export default function DistributionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [newDistribution, setNewDistribution] = useState({
    type: 'beneficiary' as 'beneficiary' | 'workshop' | 'emergency',
    productId: '',
    quantity: 0,
    recipient: '',
    distributedBy: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchProducts()
    fetchDistributions()
    setNewDistribution(prev => ({ ...prev, distributedBy: session.user?.email || '' }))
  }, [session, status, router])

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      setError('Failed to fetch products')
    }
  }

  async function fetchDistributions() {
    setLoading(true)
    try {
      const res = await fetch('/api/distributions')
      const data = await res.json()
      setDistributions(data)
    } catch (err) {
      setError('Failed to fetch distributions')
    } finally {
      setLoading(false)
    }
  }

  async function addDistribution() {
    if (!newDistribution.productId || !newDistribution.quantity || !newDistribution.recipient) {
      setError('Product, quantity, and recipient are required')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/distributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDistribution)
      })

      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to record distribution')
        return
      }

      setNewDistribution({
        type: 'beneficiary',
        productId: '',
        quantity: 0,
        recipient: '',
        distributedBy: session?.user?.email || '',
        notes: ''
      })
      fetchDistributions()
      fetchProducts() // Refresh to update stock levels
    } catch (err) {
      setError('Failed to record distribution')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') return <div>Loading...</div>
  if (!session) return null

  const selectedProduct = products.find(p => p._id === newDistribution.productId)

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">📋 Distribution Tracking</h1>
        <p className="text-muted-foreground">
          Track and manage material distributions to beneficiaries, workshops, and emergency responses
        </p>
      </div>

      {/* Distribution Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #e0e7ff' }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#1e40af' }}>🤝 Beneficiary</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#1e40af' }}>
            {distributions.filter(d => d.type === 'beneficiary').length}
          </p>
        </div>
        <div style={{ background: '#fef7f0', padding: '15px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#ea580c' }}>🎪 Workshop</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#ea580c' }}>
            {distributions.filter(d => d.type === 'workshop').length}
          </p>
        </div>
        <div style={{ background: '#fef2f2', padding: '15px', borderRadius: '8px', border: '1px solid #fecaca' }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#dc2626' }}>🚨 Emergency</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#dc2626' }}>
            {distributions.filter(d => d.type === 'emergency').length}
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

      {/* Record Distribution Form */}
      <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
        <h3>Record New Distribution</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', alignItems: 'end' }}>
          <select
            value={newDistribution.type}
            onChange={(e) => setNewDistribution({ ...newDistribution, type: e.target.value as 'beneficiary' | 'workshop' | 'emergency' })}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            disabled={loading}
          >
            <option value="beneficiary">🤝 Beneficiary</option>
            <option value="workshop">🎪 Workshop</option>
            <option value="emergency">🚨 Emergency</option>
          </select>
          <select
            value={newDistribution.productId}
            onChange={(e) => setNewDistribution({ ...newDistribution, productId: e.target.value })}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            disabled={loading}
          >
            <option value="">Select Product</option>
            {products.map((product) => (
              <option key={product._id} value={product._id}>
                {product.name} (Stock: {product.stock})
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Quantity"
            value={newDistribution.quantity}
            max={selectedProduct?.stock || 0}
            onChange={(e) => setNewDistribution({ ...newDistribution, quantity: parseInt(e.target.value) || 0 })}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            disabled={loading}
          />
          <input
            placeholder="Recipient"
            value={newDistribution.recipient}
            onChange={(e) => setNewDistribution({ ...newDistribution, recipient: e.target.value })}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            disabled={loading}
          />
          <button
            onClick={addDistribution}
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
            {loading ? 'Recording...' : 'Record Distribution'}
          </button>
        </div>
        {selectedProduct && (
          <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
            Available: {selectedProduct.stock} {selectedProduct.name}
          </p>
        )}
      </div>

      {/* Distributions History */}
      <h3>Recent Distributions</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>Date</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>Type</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>Product</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>Quantity</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>Recipient</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>Distributed By</th>
          </tr>
        </thead>
        <tbody>
          {distributions.map((distribution) => (
            <tr key={distribution._id}>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                {new Date(distribution.date).toLocaleDateString()}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                {distribution.type === 'beneficiary' && '🤝 Beneficiary'}
                {distribution.type === 'workshop' && '🎪 Workshop'}
                {distribution.type === 'emergency' && '🚨 Emergency'}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                {distribution.productName}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                {distribution.quantity}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                {distribution.recipient}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                {distribution.distributedBy}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!loading && distributions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No distributions recorded yet. Record your first distribution above!
        </div>
      )}
    </div>
  )
}