'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Product } from '@/types/product'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', stock: 0, price: 0 })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchProducts()
  }, [session, status, router])

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredProducts(filtered)
  }, [products, searchTerm])

  async function fetchProducts() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      setError('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  async function addProduct() {
    if (!newProduct.name || !newProduct.sku) {
      setError('Name and SKU are required')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      })

      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to add product')
        return
      }

      setNewProduct({ name: '', sku: '', stock: 0, price: 0 })
      fetchProducts()
    } catch (err) {
      setError('Failed to add product')
    } finally {
      setLoading(false)
    }
  }

  async function updateProduct(id: string, product: Product) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      })

      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to update product')
        return
      }

      setEditingId(null)
      fetchProducts()
    } catch (err) {
      setError('Failed to update product')
    } finally {
      setLoading(false)
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })

      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to delete product')
        return
      }

      fetchProducts()
    } catch (err) {
      setError('Failed to delete product')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') return <div>Loading...</div>
  if (!session) return null

  const totalProducts = products.length
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0)
  const lowStockCount = products.filter(p => p.stock < 10).length

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Simple Inventory</h1>
        <div>
          <span>Welcome, {session.user?.email}</span>
          <button onClick={() => signOut()} style={{ marginLeft: '10px', padding: '5px 10px' }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #e0e7ff' }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#1e40af' }}>Total Products</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#1e40af' }}>{totalProducts}</p>
        </div>
        <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#166534' }}>Total Value</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#166534' }}>${totalValue.toFixed(2)}</p>
        </div>
        <div style={{ background: lowStockCount > 0 ? '#fef2f2' : '#f0fdf4', padding: '15px', borderRadius: '8px', border: lowStockCount > 0 ? '1px solid #fecaca' : '1px solid #dcfce7' }}>
          <h3 style={{ margin: '0 0 5px 0', color: lowStockCount > 0 ? '#dc2626' : '#166534' }}>Low Stock Items</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: lowStockCount > 0 ? '#dc2626' : '#166534' }}>{lowStockCount}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search products by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '16px' }}
        />
      </div>

      <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
        <h3>Add New Product</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', alignItems: 'end' }}>
          <input
            placeholder="Name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            disabled={loading}
          />
          <input
            placeholder="SKU"
            value={newProduct.sku}
            onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            disabled={loading}
          />
          <input
            type="number"
            placeholder="Stock"
            value={newProduct.stock}
            onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            disabled={loading}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Price"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            disabled={loading}
          />
          <button
            onClick={addProduct}
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
            {loading ? 'Adding...' : 'Add Product'}
          </button>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>Name</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>SKU</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>Stock</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>Price</th>
            <th style={{ border: '1px solid #ccc', padding: '10px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((product) => (
            <tr key={product._id} style={{ backgroundColor: product.stock < 10 ? '#ffe6e6' : 'white' }}>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                {editingId === product._id ? (
                  <input
                    value={product.name}
                    onChange={(e) => setProducts(products.map(p =>
                      p._id === product._id ? { ...p, name: e.target.value } : p
                    ))}
                  />
                ) : product.name}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                {editingId === product._id ? (
                  <input
                    value={product.sku}
                    onChange={(e) => setProducts(products.map(p =>
                      p._id === product._id ? { ...p, sku: e.target.value } : p
                    ))}
                  />
                ) : product.sku}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                {editingId === product._id ? (
                  <input
                    type="number"
                    value={product.stock}
                    onChange={(e) => setProducts(products.map(p =>
                      p._id === product._id ? { ...p, stock: parseInt(e.target.value) || 0 } : p
                    ))}
                  />
                ) : (
                  <span>
                    {product.stock}
                    {product.stock < 10 && <span style={{ color: 'red', marginLeft: '5px' }}>⚠️ Low</span>}
                  </span>
                )}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                {editingId === product._id ? (
                  <input
                    type="number"
                    step="0.01"
                    value={product.price}
                    onChange={(e) => setProducts(products.map(p =>
                      p._id === product._id ? { ...p, price: parseFloat(e.target.value) || 0 } : p
                    ))}
                  />
                ) : `$${product.price.toFixed(2)}`}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                {editingId === product._id ? (
                  <>
                    <button
                      onClick={() => updateProduct(product._id!, product)}
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
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      disabled={loading}
                      style={{
                        margin: '2px',
                        padding: '3px 6px',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingId(product._id!)}
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
                      onClick={() => deleteProduct(product._id!)}
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
                      {loading ? 'Deleting...' : 'Delete'}
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {loading && products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Loading products...
        </div>
      )}

      {!loading && products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No products yet. Add your first product above!
        </div>
      )}

      {!loading && products.length > 0 && filteredProducts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No products match your search.
        </div>
      )}
    </div>
  )
}