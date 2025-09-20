'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Product, Workshop, UserBalance } from '@/types/product'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', stock: 0, price: 0, category: 'materials' as 'materials' | 'refreshments', notes: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [userBalances, setUserBalances] = useState<UserBalance[]>([])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchWorkshops()
    if (session.user.role === 'admin') {
      fetchProducts()
    } else {
      fetchUserBalances()
    }
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

      setNewProduct({ name: '', sku: '', stock: 0, price: 0, category: 'materials', notes: '' })
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

  async function fetchWorkshops() {
    try {
      const res = await fetch('/api/workshops')
      const data = await res.json()
      setWorkshops(data)
    } catch (err) {
      // Silent fail for workshops - they're optional for inventory view
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

  if (status === 'loading') return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  if (!session) return null

  const totalProducts = products.length
  const materialsCount = products.filter(p => p.category === 'materials').length
  const refreshmentsCount = products.filter(p => p.category === 'refreshments').length
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0)
  const lowStockCount = products.filter(p => p.stock < 10).length

  // Workshop metrics
  const upcomingWorkshops = workshops.filter(w => w.status === 'planned').length
  const completedWorkshops = workshops.filter(w => w.status === 'completed').length

  return (
    <div className="p-5 font-sans">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-bold mb-2">📦 Materials & Workshop Management</h1>
          <div className="mt-2.5">
            <span className="text-blue-600 font-bold">📦 Inventory</span>
            <Link href="/workshops" className="ml-4 text-blue-600 no-underline hover:underline">🎪 Workshops</Link>
            <Link href="/distributions" className="ml-4 text-blue-600 no-underline hover:underline">📋 Distributions</Link>
            <Link href="/reports" className="ml-4 text-blue-600 no-underline hover:underline">📊 Reports</Link>
            {session?.user?.role === 'admin' && (
              <Link href="/admin" className="ml-4 text-blue-600 no-underline hover:underline">⚙️ Admin</Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span>Welcome, {session.user?.email}</span>
          <Button onClick={() => signOut()} variant="outline" size="sm">
            Sign Out
          </Button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="mb-5">
        <h2 className="m-0 mb-4 text-gray-700 text-xl font-semibold">
          📊 {session?.user?.role === 'admin' ? 'System Overview' : 'My Dashboard'}
        </h2>

        {session?.user?.role === 'admin' ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4 mb-5">
            <Card className="bg-blue-50 border-blue-200 py-4">
              <CardContent className="p-4">
                <CardTitle className="text-blue-800 text-sm mb-1">📦 Materials</CardTitle>
                <p className="text-2xl font-bold m-0 text-blue-800">{materialsCount}</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200 py-4">
              <CardContent className="p-4">
                <CardTitle className="text-orange-600 text-sm mb-1">🍪 Refreshments</CardTitle>
                <p className="text-2xl font-bold m-0 text-orange-600">{refreshmentsCount}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200 py-4">
              <CardContent className="p-4">
                <CardTitle className="text-green-700 text-sm mb-1">💰 Total Value</CardTitle>
                <p className="text-2xl font-bold m-0 text-green-700">${totalValue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className={`py-4 ${
              lowStockCount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
            }`}>
              <CardContent className="p-4">
                <CardTitle className={`text-sm mb-1 ${
                  lowStockCount > 0 ? 'text-red-600' : 'text-green-700'
                }`}>⚠️ Low Stock</CardTitle>
                <p className={`text-2xl font-bold m-0 ${
                  lowStockCount > 0 ? 'text-red-600' : 'text-green-700'
                }`}>{lowStockCount}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-50 border-gray-300 py-4">
              <CardContent className="p-4">
                <CardTitle className="text-gray-700 text-sm mb-1">📅 Upcoming</CardTitle>
                <p className="text-2xl font-bold m-0 text-gray-700">{upcomingWorkshops}</p>
                <p className="text-xs m-0 text-gray-500">workshops</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200 py-4">
              <CardContent className="p-4">
                <CardTitle className="text-green-700 text-sm mb-1">✅ Completed</CardTitle>
                <p className="text-2xl font-bold m-0 text-green-700">{completedWorkshops}</p>
                <p className="text-xs m-0 text-gray-500">workshops</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-5">
            <Card className="bg-blue-50 border-blue-200 py-4">
              <CardContent className="p-4">
                <CardTitle className="text-blue-800 text-sm mb-1">📦 My Materials</CardTitle>
                <p className="text-2xl font-bold m-0 text-blue-800">
                  {userBalances.filter(b => b.productName && products.find(p => p._id === b.productId)?.category === 'materials').length}
                </p>
                <p className="text-xs m-0 text-gray-500">different types</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200 py-4">
              <CardContent className="p-4">
                <CardTitle className="text-orange-600 text-sm mb-1">🍪 My Refreshments</CardTitle>
                <p className="text-2xl font-bold m-0 text-orange-600">
                  {userBalances.filter(b => b.productName && products.find(p => p._id === b.productId)?.category === 'refreshments').length}
                </p>
                <p className="text-xs m-0 text-gray-500">different types</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-50 border-gray-300 py-4">
              <CardContent className="p-4">
                <CardTitle className="text-gray-700 text-sm mb-1">📅 My Workshops</CardTitle>
                <p className="text-2xl font-bold m-0 text-gray-700">
                  {workshops.filter(w => w.conductedBy === session?.user?.id && w.status === 'planned').length}
                </p>
                <p className="text-xs m-0 text-gray-500">upcoming</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200 py-4">
              <CardContent className="p-4">
                <CardTitle className="text-green-700 text-sm mb-1">✅ Completed</CardTitle>
                <p className="text-2xl font-bold m-0 text-green-700">
                  {workshops.filter(w => w.conductedBy === session?.user?.id && w.status === 'completed').length}
                </p>
                <p className="text-xs m-0 text-gray-500">workshops</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* User Balances Section - Only for regular users */}
      {session?.user?.role === 'user' && (
        <div className="mb-5">
          <h3 className="text-lg font-semibold mb-3">📋 My Material Balances</h3>
          {userBalances.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
              {userBalances.map((balance) => (
                <Card key={balance._id} className="bg-gray-50">
                  <CardContent className="p-4">
                    <CardTitle className="mb-2.5">{balance.productName}</CardTitle>
                    <div className="flex justify-between mb-1">
                      <span>Available:</span>
                      <span className={`font-bold ${
                        balance.availableQuantity > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {balance.availableQuantity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Allocated:</span>
                      <span>{balance.allocatedQuantity}</span>
                    </div>
                    <div className="w-full bg-gray-300 rounded h-2 mt-2.5">
                      <div
                        className={`h-full rounded ${
                          balance.availableQuantity > balance.allocatedQuantity * 0.2 ? 'bg-green-600' : 'bg-red-600'
                        }`}
                        style={{
                          width: `${(balance.availableQuantity / balance.allocatedQuantity) * 100}%`
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center p-10 text-gray-600">
              <CardContent>
                No materials allocated yet. Contact your admin to get materials allocated to your account.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertDescription className="flex justify-between items-center">
            {error}
            <Button
              onClick={() => setError('')}
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-destructive hover:text-destructive"
            >
              ×
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="mb-5">
        <Input
          type="text"
          placeholder="Search products by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-base"
        />
      </div>

      {/* Admin View: Main Stock Management */}
      {session?.user?.role === 'admin' ? (
        <div>
          {/* Add Item Section - Admin Only */}
          <Card className="mb-5">
            <CardHeader>
              <CardTitle>Add New Item to Main Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2.5 items-end">
                <Input
                  placeholder="Name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  disabled={loading}
                />
                <Input
                  placeholder="SKU"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  disabled={loading}
                />
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as 'materials' | 'refreshments' })}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                >
                  <option value="materials">📦 Materials</option>
                  <option value="refreshments">🍪 Refreshments</option>
                </select>
                <Input
                  type="number"
                  placeholder="Stock"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                  disabled={loading}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                  disabled={loading}
                />
                <Button
                  onClick={addProduct}
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Item'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Stock Table - Admin Only */}
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product._id} className={product.stock < 10 ? 'bg-red-50' : ''}>
                  <TableCell>
                    {editingId === product._id ? (
                      <Input
                        value={product.name}
                        onChange={(e) => setProducts(products.map(p =>
                          p._id === product._id ? { ...p, name: e.target.value } : p
                        ))}
                        className="h-8"
                      />
                    ) : product.name}
                  </TableCell>
                  <TableCell>
                    {editingId === product._id ? (
                      <Input
                        value={product.sku}
                        onChange={(e) => setProducts(products.map(p =>
                          p._id === product._id ? { ...p, sku: e.target.value } : p
                        ))}
                        className="h-8"
                      />
                    ) : product.sku}
                  </TableCell>
                  <TableCell>
                    {editingId === product._id ? (
                      <select
                        value={product.category}
                        onChange={(e) => setProducts(products.map(p =>
                          p._id === product._id ? { ...p, category: e.target.value as 'materials' | 'refreshments' } : p
                        ))}
                        className="h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="materials">📦 Materials</option>
                        <option value="refreshments">🍪 Refreshments</option>
                      </select>
                    ) : (
                      <span>{product.category === 'materials' ? '📦 Materials' : '🍪 Refreshments'}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === product._id ? (
                      <Input
                        type="number"
                        value={product.stock}
                        onChange={(e) => setProducts(products.map(p =>
                          p._id === product._id ? { ...p, stock: parseInt(e.target.value) || 0 } : p
                        ))}
                        className="h-8"
                      />
                    ) : (
                      <span>
                        {product.stock}
                        {product.stock < 10 && <span className="text-red-600 ml-1">⚠️ Low</span>}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === product._id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={product.price}
                        onChange={(e) => setProducts(products.map(p =>
                          p._id === product._id ? { ...p, price: parseFloat(e.target.value) || 0 } : p
                        ))}
                        className="h-8"
                      />
                    ) : `$${product.price.toFixed(2)}`}
                  </TableCell>
                  <TableCell>
                    {editingId === product._id ? (
                      <div className="flex gap-1">
                        <Button
                          onClick={() => updateProduct(product._id!, product)}
                          disabled={loading}
                          size="sm"
                          className="h-7 px-2"
                        >
                          {loading ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          onClick={() => setEditingId(null)}
                          disabled={loading}
                          variant="secondary"
                          size="sm"
                          className="h-7 px-2"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          onClick={() => setEditingId(product._id!)}
                          disabled={loading}
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 bg-green-600 text-white hover:bg-green-700"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => deleteProduct(product._id!)}
                          disabled={loading}
                          variant="destructive"
                          size="sm"
                          className="h-7 px-2"
                        >
                          {loading ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {loading && products.length === 0 && (
            <div className="text-center py-10 text-gray-600">
              Loading products...
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="text-center py-10 text-gray-600">
              No products yet. Add your first product above!
            </div>
          )}

          {!loading && products.length > 0 && filteredProducts.length === 0 && (
            <div className="text-center py-10 text-gray-600">
              No products match your search.
            </div>
          )}
        </div>
      ) : (
        /* User View: Personal Stock Only */
        <div>
          <h3 className="text-lg font-semibold mb-4">📦 My Personal Stock</h3>
          {userBalances.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
              {userBalances.map((balance) => (
                <Card key={balance._id} className="bg-gray-50">
                  <CardContent className="p-5">
                    <CardTitle className="mb-4 text-lg">{balance.productName}</CardTitle>

                    <div className="mb-2.5">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Available:</span>
                        <span className={`font-bold text-lg ${
                          balance.availableQuantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {balance.availableQuantity}
                        </span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Total Allocated:</span>
                        <span className="font-bold">{balance.allocatedQuantity}</span>
                      </div>
                      <div className="flex justify-between mb-2.5">
                        <span className="text-gray-600">Used:</span>
                        <span className="text-gray-600">{balance.allocatedQuantity - balance.availableQuantity}</span>
                      </div>
                    </div>

                    {/* Usage Progress Bar */}
                    <div className="mb-2.5">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Usage Progress</span>
                        <span>{Math.round(((balance.allocatedQuantity - balance.availableQuantity) / balance.allocatedQuantity) * 100) || 0}% used</span>
                      </div>
                      <div className="w-full bg-gray-300 rounded h-2">
                        <div
                          className={`h-full rounded ${
                            balance.availableQuantity > balance.allocatedQuantity * 0.2 ? 'bg-green-600' : 'bg-red-600'
                          }`}
                          style={{
                            width: `${((balance.allocatedQuantity - balance.availableQuantity) / balance.allocatedQuantity) * 100 || 0}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Stock Status */}
                    <div className={`p-2 rounded text-center text-sm font-bold ${
                      balance.availableQuantity > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {balance.availableQuantity > 0 ? '✅ Available' : '❌ Out of Stock'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-15 text-gray-600 border-2 border-dashed">
              <CardContent>
                <div className="text-5xl mb-4">📦</div>
                <CardTitle className="mb-2.5 text-gray-700">No Materials Allocated Yet</CardTitle>
                <p className="mb-0 text-base">Contact your admin to get materials allocated to your account.</p>
                <p className="mt-2.5 mb-0 text-sm text-gray-400">
                  Once allocated, you can distribute materials to workshop participants.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions for Users */}
          <Card className="mt-8 bg-slate-50 border-slate-200">
            <CardHeader>
              <CardTitle className="text-gray-700">🚀 Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                <Link
                  href="/workshops"
                  className="block p-4 bg-blue-600 text-white no-underline rounded-md text-center font-bold hover:bg-blue-700 transition-colors"
                >
                  🎪 Manage Workshops
                </Link>
                <Link
                  href="/reports"
                  className="block p-4 bg-green-600 text-white no-underline rounded-md text-center font-bold hover:bg-green-700 transition-colors"
                >
                  📊 View Reports
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}