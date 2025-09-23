'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Product, Workshop, UserBalance } from '@/types/product'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NumberInput } from '@/components/ui/number-input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

// Memoized metric card component
const MetricCard = memo(({ title, value, color, subtitle }: {
  title: string
  value: number | string
  color: string
  subtitle?: string
}) => (
  <Card className={`${color} py-4`}>
    <CardContent className="p-4">
      <CardTitle className={`text-sm mb-1 ${color.includes('blue') ? 'text-blue-800' :
        color.includes('orange') ? 'text-orange-600' :
        color.includes('green') ? 'text-green-700' :
        color.includes('red') ? 'text-red-600' : 'text-gray-700'}`}>
        {title}
      </CardTitle>
      <p className={`text-2xl font-bold m-0 ${color.includes('blue') ? 'text-blue-800' :
        color.includes('orange') ? 'text-orange-600' :
        color.includes('green') ? 'text-green-700' :
        color.includes('red') ? 'text-red-600' : 'text-gray-700'}`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs m-0 text-gray-500">{subtitle}</p>
      )}
    </CardContent>
  </Card>
))

// Memoized user balance card component
const UserBalanceCard = memo(({ balance }: { balance: UserBalance }) => (
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
))

// Memoized product table row component
const ProductTableRow = memo(({
  product,
  editingId,
  loading,
  setEditingId,
  setProducts,
  products,
  updateProduct,
  deleteProduct
}: {
  product: Product
  editingId: string | null
  loading: boolean
  setEditingId: (id: string | null) => void
  setProducts: (products: Product[]) => void
  products: Product[]
  updateProduct: (id: string, product: Product) => void
  deleteProduct: (id: string) => void
}) => {
  const updateProductField = useCallback((field: keyof Product, value: any) => {
    setProducts(products.map(p =>
      p._id === product._id ? { ...p, [field]: value } : p
    ))
  }, [products, product._id, setProducts])

  return (
    <TableRow key={product._id} className={product.stock < 10 ? 'bg-red-50' : ''}>
      <TableCell>
        {editingId === product._id ? (
          <Input
            value={product.name}
            onChange={(e) => updateProductField('name', e.target.value)}
            className="h-8"
          />
        ) : product.name}
      </TableCell>
      <TableCell>
        {editingId === product._id ? (
          <Input
            value={product.sku}
            onChange={(e) => updateProductField('sku', e.target.value)}
            className="h-8"
          />
        ) : product.sku}
      </TableCell>
      <TableCell>
        {editingId === product._id ? (
          <select
            value={product.category}
            onChange={(e) => updateProductField('category', e.target.value as 'materials' | 'refreshments')}
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
          <NumberInput
            value={product.stock}
            onChange={(value) => updateProductField('stock', value)}
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
          <NumberInput
            step="0.01"
            value={product.price}
            onChange={(value) => updateProductField('price', value)}
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
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  disabled={loading}
                  variant="destructive"
                  size="sm"
                  className="h-7 px-2"
                >
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Product</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete "{product.name}"? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteProduct(product._id!)}
                    disabled={loading}
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </TableCell>
    </TableRow>
  )
})

export default function OptimizedDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    stock: 0,
    price: 0,
    category: 'materials' as 'materials' | 'refreshments',
    notes: ''
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [userBalances, setUserBalances] = useState<UserBalance[]>([])

  // Memoized filtered products to avoid recalculation on every render
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products

    const lowercaseSearch = searchTerm.toLowerCase()
    return products.filter(product =>
      product.name.toLowerCase().includes(lowercaseSearch) ||
      product.sku.toLowerCase().includes(lowercaseSearch)
    )
  }, [products, searchTerm])

  // Memoized metrics to avoid recalculation
  const metrics = useMemo(() => {
    const materialsCount = products.filter(p => p.category === 'materials').length
    const refreshmentsCount = products.filter(p => p.category === 'refreshments').length
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0)
    const lowStockCount = products.filter(p => p.stock < 10).length

    return {
      materialsCount,
      refreshmentsCount,
      totalValue,
      lowStockCount
    }
  }, [products])

  // Memoized workshop metrics
  const workshopMetrics = useMemo(() => {
    const upcomingWorkshops = workshops.filter(w => w.status === 'planned').length
    const completedWorkshops = workshops.filter(w => w.status === 'completed').length

    return {
      upcomingWorkshops,
      completedWorkshops
    }
  }, [workshops])

  // Memoized user workshop metrics
  const userWorkshopMetrics = useMemo(() => {
    if (!session?.user?.id) return { upcoming: 0, completed: 0 }

    const upcoming = workshops.filter(w =>
      w.conductedBy === session.user.id && w.status === 'planned'
    ).length

    const completed = workshops.filter(w =>
      w.conductedBy === session.user.id && w.status === 'completed'
    ).length

    return { upcoming, completed }
  }, [workshops, session?.user?.id])

  // API functions with useCallback to prevent unnecessary re-renders
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data.data || data) // Handle both paginated and direct responses
    } catch (err) {
      setError('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }, [])

  const addProduct = useCallback(async () => {
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
  }, [newProduct, fetchProducts])

  const updateProduct = useCallback(async (id: string, product: Product) => {
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
  }, [fetchProducts])

  const deleteProduct = useCallback(async (id: string) => {
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
  }, [fetchProducts])

  const fetchWorkshops = useCallback(async () => {
    try {
      const res = await fetch('/api/workshops')
      const data = await res.json()
      setWorkshops(data)
    } catch (err) {
      // Silent fail for workshops - they're optional for inventory view
    }
  }, [])

  const fetchUserBalances = useCallback(async () => {
    try {
      const res = await fetch('/api/user-balances')
      const data = await res.json()
      setUserBalances(data)
    } catch (err) {
      // Silent fail for user balances
    }
  }, [])

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
  }, [session, status, router, fetchProducts, fetchWorkshops, fetchUserBalances])

  if (status === 'loading') return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  if (!session) return null

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">📦 Dashboard</h1>
        <p className="text-muted-foreground">
          {session?.user?.role === 'admin'
            ? 'Manage your inventory, workshops, and system users'
            : 'View your allocated materials and workshop activities'
          }
        </p>
      </div>

      {/* Dashboard Cards */}
      <div className="mb-5">
        <h2 className="m-0 mb-4 text-gray-700 text-xl font-semibold">
          📊 {session?.user?.role === 'admin' ? 'System Overview' : 'My Dashboard'}
        </h2>

        {session?.user?.role === 'admin' ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4 mb-5">
            <MetricCard title="📦 Materials" value={metrics.materialsCount} color="bg-blue-50 border-blue-200" />
            <MetricCard title="🍪 Refreshments" value={metrics.refreshmentsCount} color="bg-orange-50 border-orange-200" />
            <MetricCard title="💰 Total Value" value={`$${metrics.totalValue.toFixed(2)}`} color="bg-green-50 border-green-200" />
            <MetricCard
              title="⚠️ Low Stock"
              value={metrics.lowStockCount}
              color={metrics.lowStockCount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}
            />
            <MetricCard title="📅 Upcoming" value={workshopMetrics.upcomingWorkshops} color="bg-gray-50 border-gray-300" subtitle="workshops" />
            <MetricCard title="✅ Completed" value={workshopMetrics.completedWorkshops} color="bg-green-50 border-green-200" subtitle="workshops" />
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-5">
            <MetricCard
              title="📦 My Materials"
              value={userBalances.filter(b => b.productName && products.find(p => p._id === b.productId)?.category === 'materials').length}
              color="bg-blue-50 border-blue-200"
              subtitle="different types"
            />
            <MetricCard
              title="🍪 My Refreshments"
              value={userBalances.filter(b => b.productName && products.find(p => p._id === b.productId)?.category === 'refreshments').length}
              color="bg-orange-50 border-orange-200"
              subtitle="different types"
            />
            <MetricCard
              title="📅 My Workshops"
              value={userWorkshopMetrics.upcoming}
              color="bg-gray-50 border-gray-300"
              subtitle="upcoming"
            />
            <MetricCard
              title="✅ Completed"
              value={userWorkshopMetrics.completed}
              color="bg-green-50 border-green-200"
              subtitle="workshops"
            />
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
                <UserBalanceCard key={balance._id} balance={balance} />
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
                <NumberInput
                  placeholder="Stock"
                  value={newProduct.stock}
                  onChange={(value) => setNewProduct({ ...newProduct, stock: value })}
                  disabled={loading}
                />
                <NumberInput
                  step="0.01"
                  placeholder="Price"
                  value={newProduct.price}
                  onChange={(value) => setNewProduct({ ...newProduct, price: value })}
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
                <ProductTableRow
                  key={product._id}
                  product={product}
                  editingId={editingId}
                  loading={loading}
                  setEditingId={setEditingId}
                  setProducts={setProducts}
                  products={products}
                  updateProduct={updateProduct}
                  deleteProduct={deleteProduct}
                />
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