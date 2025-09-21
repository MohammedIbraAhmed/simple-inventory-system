'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, Product, UserBalance } from '@/types/product'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    profile: {
      organization: '',
      phone: '',
      location: ''
    }
  })
  const [showPassword, setShowPassword] = useState(false)
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

    if (newUser.password && newUser.password.length < 6) {
      setError('Password must be at least 6 characters long')
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
        password: '',
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

  async function resetUserPassword(userId: string, userEmail: string) {
    // Will be handled by Dialog component

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      })

      const result = await res.json()
      if (res.ok) {
        // Show success message with proper UI component
        setError(`Password reset initiated. Reset token: ${result.resetToken}`)
      } else {
        setError(result.error || 'Failed to reset password')
      }
    } catch (err) {
      setError('Failed to reset password')
    }
  }

  if (status === 'loading') return <div>Loading...</div>
  if (!session || session.user.role !== 'admin') return null

  const selectedProduct = products.find(p => p._id === allocation.productId)

  return (
    <div className="container px-4 py-6 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">⚙️ Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, allocate stock, and oversee system operations
        </p>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'users' | 'allocation')} className="mb-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 h-auto md:h-10">
          <TabsTrigger value="users">👥 User Management</TabsTrigger>
          <TabsTrigger value="allocation">📤 Stock Allocation</TabsTrigger>
        </TabsList>

        {/* Error Message */}
        {error && (
          <Alert variant={error.includes('Reset token') ? 'default' : 'destructive'} className="mb-6">
            <AlertDescription className="flex justify-between items-center">
              {error}
              <Button
                onClick={() => setError('')}
                variant="ghost"
                size="sm"
                className="h-auto p-0"
              >
                ×
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <TabsContent value="users" className="space-y-6">
          {/* Create User Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  placeholder="Full Name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  disabled={loading}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  disabled={loading}
                />
              <div style={{ position: 'relative' }}>
                <input
                  placeholder="Password (optional)"
                  type={showPassword ? 'text' : 'password'}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', paddingRight: '35px', boxSizing: 'border-box' }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '5px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value as 'admin' | 'user' })} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">👤 Regular User</SelectItem>
                    <SelectItem value="admin">⚙️ Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Organization"
                  value={newUser.profile.organization}
                  onChange={(e) => setNewUser({ ...newUser, profile: { ...newUser.profile, organization: e.target.value } })}
                  disabled={loading}
                />
                <Button
                  onClick={createUser}
                  disabled={loading}
                  className="md:col-span-1"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                {newUser.password
                  ? 'Custom password will be set for this user'
                  : 'Default password "password" will be used (user can change later)'
                }
              </p>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>System Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(users) && users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? '⚙️ Admin' : '👤 User'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.profile?.organization || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'destructive'}>
                          {user.isActive ? '✅ Active' : '❌ Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => toggleUserStatus(user._id!, user.isActive)}
                            variant={user.isActive ? 'destructive' : 'default'}
                            size="sm"
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Reset Password"
                              >
                                🔑
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reset Password</DialogTitle>
                                <DialogDescription>
                                  Reset password for {user.email}? A new temporary password will be generated.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline">
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => resetUserPassword(user._id!, user.email)}
                                >
                                  Reset Password
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-6">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}