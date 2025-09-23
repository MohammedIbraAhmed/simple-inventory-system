'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, Product, UserBalance, LocationRequest } from '@/types/product'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NumberInput } from '@/components/ui/number-input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [locationRequests, setLocationRequests] = useState<LocationRequest[]>([])
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
  const [testingNotifications, setTestingNotifications] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    role: 'user'
  })
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'users' | 'allocation' | 'location-requests'>('users')

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
    fetchLocationRequests()
  }, [session, status, router])

  async function fetchUsers() {
    try {
      const res = await fetch('/api/users')
      const response = await res.json()

      if (!res.ok) {
        toast.error(response.error || 'Failed to fetch users')
        return
      }

      // Handle the API response structure that includes pagination
      setUsers(response.data || [])
    } catch (err) {
      toast.error('Failed to fetch users')
      setUsers([])
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products')
      const response = await res.json()
      // Handle the API response structure that includes pagination
      setProducts(response.data || [])
    } catch (err) {
      toast.error('Failed to fetch products')
    }
  }

  async function fetchLocationRequests() {
    try {
      const res = await fetch('/api/location-requests')
      const response = await res.json()
      setLocationRequests(response || [])
    } catch (err) {
      console.error('Failed to fetch location requests:', err)
    }
  }

  async function approveLocationRequest(requestId: string, adminNotes?: string) {
    try {
      const res = await fetch(`/api/location-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', adminNotes })
      })

      if (res.ok) {
        toast.success('Location request approved successfully!')
        fetchLocationRequests()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to approve request')
      }
    } catch (err) {
      toast.error('Failed to approve request')
    }
  }

  async function rejectLocationRequest(requestId: string, adminNotes?: string) {
    try {
      const res = await fetch(`/api/location-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', adminNotes })
      })

      if (res.ok) {
        toast.success('Location request rejected')
        fetchLocationRequests()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to reject request')
      }
    } catch (err) {
      toast.error('Failed to reject request')
    }
  }

  async function createUser() {
    if (!newUser.name || !newUser.email) {
      toast.error('Name and email are required')
      return
    }

    if (newUser.password && newUser.password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })

      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || 'Failed to create user')
        return
      }

      toast.success('User created successfully!')

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
      toast.error('Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  async function allocateStock() {
    if (!allocation.userId || !allocation.productId || !allocation.quantity) {
      toast.error('User, product, and quantity are required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/user-balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allocation)
      })

      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || 'Failed to allocate stock')
        return
      }

      toast.success('Stock allocated successfully!')

      setAllocation({
        userId: '',
        productId: '',
        quantity: 0,
        notes: ''
      })
      fetchProducts() // Refresh to see updated stock levels
    } catch (err) {
      toast.error('Failed to allocate stock')
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
      toast.error('Failed to update user status')
    }
  }

  async function resetUserPassword(userId: string, userEmail: string) {
    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      })

      const result = await res.json()
      if (res.ok) {
        toast.success(`Password reset email sent to ${userEmail}. Please check your email for the reset link.`)
        setResetPasswordDialogOpen(null) // Close dialog
      } else {
        toast.error(result.error || 'Failed to reset password')
      }
    } catch (err) {
      toast.error('Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  async function testNotifications() {
    setTestingNotifications(true)

    try {
      const res = await fetch('/api/notifications/create-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await res.json()
      if (res.ok) {
        toast.success('Test notifications created successfully! Check the notification bell.')
      } else {
        toast.error(result.error || 'Failed to create test notifications')
      }
    } catch (err) {
      toast.error('Failed to create test notifications')
    } finally {
      setTestingNotifications(false)
    }
  }

  async function testEmailConnection() {
    setTestingConnection(true)

    try {
      const res = await fetch('/api/email/test-connection')
      const result = await res.json()

      if (res.ok && result.success) {
        toast.success('SMTP connection test successful! Email server is reachable.')
      } else {
        toast.error(`SMTP connection failed: ${result.details || result.error}`)
        console.log('Email config:', result.config)
      }
    } catch (err) {
      toast.error('Failed to test SMTP connection')
    } finally {
      setTestingConnection(false)
    }
  }

  async function testEmail() {
    setTestingEmail(true)

    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session?.user?.email })
      })

      const result = await res.json()
      if (res.ok && result.success) {
        toast.success(`Test email sent successfully to ${session?.user?.email}! Check your inbox.`)
      } else {
        toast.error(`Email test failed: ${result.message || result.error || 'Unknown error'}`)
        console.log('Email configuration:', result.emailConfiguration)
      }
    } catch (err) {
      toast.error('Failed to test email service')
    } finally {
      setTestingEmail(false)
    }
  }

  function openEditUser(user: User) {
    setEditingUser(user)
    setEditUserData({
      name: user.name,
      email: user.email,
      role: user.role
    })
  }

  function closeEditUser() {
    setEditingUser(null)
    setEditUserData({ name: '', email: '', role: 'user' })
  }

  async function updateUser() {
    if (!editUserData.name || !editUserData.email) {
      toast.error('Name and email are required')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUserData)
      })

      const result = await res.json()
      if (res.ok) {
        toast.success('User updated successfully')
        closeEditUser()
        fetchUsers()
      } else {
        toast.error(result.error || 'Failed to update user')
      }
    } catch (err) {
      toast.error('Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') return <div>Loading...</div>
  if (!session || session.user.role !== 'admin') return null

  const selectedProduct = Array.isArray(products) ? products.find(p => p._id === allocation.productId) : null

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">⚙️ Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage users, allocate stock, and oversee system operations
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={testEmailConnection}
              disabled={testingConnection}
              variant="outline"
              size="sm"
            >
              {testingConnection ? 'Testing...' : '🔌 Test SMTP'}
            </Button>
            <Button
              onClick={testEmail}
              disabled={testingEmail}
              variant="outline"
              size="sm"
            >
              {testingEmail ? 'Sending...' : '📧 Test Email'}
            </Button>
            <Button
              onClick={testNotifications}
              disabled={testingNotifications}
              variant="outline"
              size="sm"
            >
              {testingNotifications ? 'Creating...' : '🔔 Test Notifications'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'users' | 'allocation' | 'location-requests')} className="mb-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto md:h-10">
          <TabsTrigger value="users">👥 User Management</TabsTrigger>
          <TabsTrigger value="allocation">📤 Stock Allocation</TabsTrigger>
          <TabsTrigger value="location-requests">📍 Location Requests</TabsTrigger>
        </TabsList>


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
                            onClick={() => openEditUser(user)}
                            variant="outline"
                            size="sm"
                            title="Edit User"
                          >
                            ✏️
                          </Button>
                          <Button
                            onClick={() => toggleUserStatus(user._id!, user.isActive)}
                            variant={user.isActive ? 'destructive' : 'default'}
                            size="sm"
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Dialog
                            open={resetPasswordDialogOpen === user._id}
                            onOpenChange={(open) => setResetPasswordDialogOpen(open ? user._id! : null)}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Reset Password"
                                onClick={() => setResetPasswordDialogOpen(user._id!)}
                              >
                                🔑
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reset Password</DialogTitle>
                                <DialogDescription>
                                  Reset password for {user.email}? A new temporary password will be generated and sent via email.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setResetPasswordDialogOpen(null)}
                                  disabled={loading}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => resetUserPassword(user._id!, user.email)}
                                  disabled={loading}
                                >
                                  {loading ? 'Sending...' : 'Reset Password'}
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
                {Array.isArray(products) ? products.filter(p => p.stock > 0).map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} (Available: {product.stock})
                  </option>
                )) : []}
              </select>
              <NumberInput
                placeholder="Quantity"
                value={allocation.quantity}
                max={selectedProduct?.stock || 0}
                onChange={(value) => setAllocation({ ...allocation, quantity: value })}
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
            {Array.isArray(products) ? products.map((product) => (
              <div key={product._id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>{product.name}</h4>
                <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: product.stock < 10 ? '#dc2626' : '#16a34a' }}>
                  {product.stock} units
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
                  {product.category === 'materials' ? '📦 Materials' : '🍪 Refreshments'}
                </p>
              </div>
            )) : []}
          </div>
        </TabsContent>

        <TabsContent value="location-requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>📍 Location Requests</CardTitle>
              <CardDescription>
                Review and approve location requests from users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {locationRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No location requests found
                </p>
              ) : (
                <div className="space-y-4">
                  {locationRequests.map((request) => (
                    <Card key={request._id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                request.status === 'pending' ? 'secondary' :
                                request.status === 'approved' ? 'default' : 'destructive'
                              }>
                                {request.status}
                              </Badge>
                              <span className="font-medium text-sm text-muted-foreground">
                                {request.requestType.toUpperCase()}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-semibold">{request.locationData.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {request.locationData.governorate} - {request.locationData.neighborhood}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Type: {request.locationData.type.replace(/_/g, ' ')}
                              </p>
                            </div>

                            <div className="text-sm">
                              <p><strong>Site Manager:</strong> {request.locationData.siteManager.name}</p>
                              <p><strong>Phone:</strong> {request.locationData.siteManager.phoneNumber}</p>
                              <p><strong>GPS:</strong> {request.locationData.gpsCoordinates.latitude.toFixed(4)}, {request.locationData.gpsCoordinates.longitude.toFixed(4)}</p>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Requested by: {request.requestedByName}</span>
                              <span>Date: {new Date(request.createdAt).toLocaleDateString()}</span>
                            </div>

                            {request.adminNotes && (
                              <div className="bg-muted p-2 rounded-md text-sm">
                                <strong>Admin Notes:</strong> {request.adminNotes}
                              </div>
                            )}
                          </div>

                          {request.status === 'pending' && (
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                onClick={() => approveLocationRequest(request._id!)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectLocationRequest(request._id!)}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && closeEditUser()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {editingUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium mb-1">Name</label>
              <Input
                id="edit-name"
                value={editUserData.name}
                onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                placeholder="User name"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="edit-email" className="block text-sm font-medium mb-1">Email</label>
              <Input
                id="edit-email"
                type="email"
                value={editUserData.email}
                onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                placeholder="user@example.com"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="edit-role" className="block text-sm font-medium mb-1">Role</label>
              <Select value={editUserData.role} onValueChange={(value) => setEditUserData({ ...editUserData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">👤 User</SelectItem>
                  <SelectItem value="admin">⚙️ Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditUser} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={updateUser} disabled={loading}>
              {loading ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}