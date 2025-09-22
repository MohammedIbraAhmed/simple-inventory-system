'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Workshop, Participant, UserBalance, Product } from '@/types/product'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

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
  const [activeTab, setActiveTab] = useState<'workshops' | 'participants' | 'materials'>('workshops')
  const [selectedParticipantForDistribution, setSelectedParticipantForDistribution] = useState<string | null>(null)
  const [materialDistribution, setMaterialDistribution] = useState({
    productId: '',
    quantity: 0
  })
  const [bulkDistribution, setBulkDistribution] = useState({
    productId: '',
    quantityPerParticipant: 0
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
    try {
      const res = await fetch('/api/workshops')
      const data = await res.json()
      setWorkshops(data)
    } catch (err) {
      toast.error('Failed to fetch workshops')
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
      toast.error('Title, date, start time, end time, and location are required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/workshops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkshop)
      })

      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || 'Failed to add workshop')
        return
      }

      toast.success('Workshop created successfully!')

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
      toast.error('Failed to add workshop')
    } finally {
      setLoading(false)
    }
  }

  async function addParticipant() {
    if (!selectedWorkshopId || !newParticipant.name || !newParticipant.age || !newParticipant.phoneNumber) {
      toast.error('Please select a workshop and fill in all required participant fields')
      return
    }

    setLoading(true)
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
        toast.error(result.error || 'Failed to add participant')
        return
      }

      toast.success(`Participant ${newParticipant.name} registered successfully!`)

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
      toast.error('Failed to add participant')
    } finally {
      setLoading(false)
    }
  }

  async function distributeMaterial() {
    if (!selectedParticipantForDistribution || !materialDistribution.productId || !materialDistribution.quantity || !selectedWorkshopId) {
      toast.error('Please select participant, product, quantity, and ensure workshop is selected')
      return
    }

    setLoading(true)
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
        toast.error(result.error || 'Failed to distribute materials')
        return
      }

      const participantName = participants.find(p => p._id === selectedParticipantForDistribution)?.name
      const productName = userBalances.find(b => b.productId === materialDistribution.productId)?.productName
      toast.success(`Successfully distributed ${materialDistribution.quantity} ${productName} to ${participantName}`)

      setMaterialDistribution({ productId: '', quantity: 0 })
      setSelectedParticipantForDistribution(null)
      fetchUserBalances()
      fetchParticipants()
    } catch (err) {
      toast.error('Failed to distribute materials')
    } finally {
      setLoading(false)
    }
  }

  async function bulkDistributeMaterials() {
    if (!bulkDistribution.productId || !bulkDistribution.quantityPerParticipant || !selectedWorkshopId) {
      toast.error('Please select product, quantity per participant, and ensure workshop is selected')
      return
    }

    if (participants.length === 0) {
      toast.error('No participants found for this workshop')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/distribute-materials/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshopId: selectedWorkshopId,
          productId: bulkDistribution.productId,
          quantityPerParticipant: bulkDistribution.quantityPerParticipant
        })
      })

      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || 'Failed to bulk distribute materials')
        return
      }

      // Show success toast
      toast.success(`Successfully distributed ${result.distributed.totalQuantity} ${result.distributed.productName} to ${result.distributed.participantCount} participants (${result.distributed.quantityPerParticipant} each)`)

      setBulkDistribution({ productId: '', quantityPerParticipant: 0 })
      fetchUserBalances()
      fetchParticipants()
    } catch (err) {
      toast.error('Failed to bulk distribute materials')
    } finally {
      setLoading(false)
    }
  }

  async function updateWorkshop(id: string, workshop: Workshop) {
    setLoading(true)
    try {
      const res = await fetch(`/api/workshops/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workshop)
      })

      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || 'Failed to update workshop')
        return
      }

      toast.success('Workshop updated successfully!')

      setEditingId(null)
      fetchWorkshops()
    } catch (err) {
      toast.error('Failed to update workshop')
    } finally {
      setLoading(false)
    }
  }

  async function deleteWorkshop(id: string) {
    // Will be handled by Dialog component

    setLoading(true)
    try {
      const res = await fetch(`/api/workshops/${id}`, { method: 'DELETE' })

      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || 'Failed to delete workshop')
        return
      }

      toast.success('Workshop deleted successfully!')

      fetchWorkshops()
    } catch (err) {
      toast.error('Failed to delete workshop')
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
    <div className="max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">🎪 Workshop Management</h1>
        <p className="text-muted-foreground">
          Create, manage, and track workshops and participant registrations
        </p>
      </div>

      {/* Workshop Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <CardTitle className="text-blue-800 text-sm mb-1">📅 Planned</CardTitle>
            <p className="text-2xl font-bold text-blue-800">{plannedWorkshops.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <CardTitle className="text-green-700 text-sm mb-1">✅ Completed</CardTitle>
            <p className="text-2xl font-bold text-green-700">{completedWorkshops.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <CardTitle className="text-orange-600 text-sm mb-1">👥 Participants</CardTitle>
            <p className="text-2xl font-bold text-orange-600">{totalParticipants}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'workshops' | 'participants' | 'materials')} className="mb-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto md:h-10">
          <TabsTrigger value="workshops">🎪 Workshops</TabsTrigger>
          <TabsTrigger value="participants">👥 Participants</TabsTrigger>
          <TabsTrigger value="materials">📦 Material Distribution</TabsTrigger>
        </TabsList>



        <TabsContent value="workshops" className="space-y-6">
          {/* Add Workshop Form */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule New Workshop</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  placeholder="Workshop Title"
                  value={newWorkshop.title}
                  onChange={(e) => setNewWorkshop({ ...newWorkshop, title: e.target.value })}
                  disabled={loading}
                />
                <Input
                  placeholder="Description"
                  value={newWorkshop.description}
                  onChange={(e) => setNewWorkshop({ ...newWorkshop, description: e.target.value })}
                  disabled={loading}
                />
                <Input
                  type="date"
                  value={newWorkshop.date}
                  onChange={(e) => setNewWorkshop({ ...newWorkshop, date: e.target.value })}
                  disabled={loading}
                />
                <Input
                  type="time"
                  placeholder="Start Time"
                  value={newWorkshop.startTime}
                  onChange={(e) => setNewWorkshop({ ...newWorkshop, startTime: e.target.value })}
                  disabled={loading}
                />
                <Input
                  type="time"
                  placeholder="End Time"
                  value={newWorkshop.endTime}
                  onChange={(e) => setNewWorkshop({ ...newWorkshop, endTime: e.target.value })}
                  disabled={loading}
                />
                <Input
                  placeholder="Location"
                  value={newWorkshop.location}
                  onChange={(e) => setNewWorkshop({ ...newWorkshop, location: e.target.value })}
                  disabled={loading}
                />
                <Input
                  type="number"
                  placeholder="Expected Participants"
                  value={newWorkshop.expectedParticipants}
                  onChange={(e) => setNewWorkshop({ ...newWorkshop, expectedParticipants: parseInt(e.target.value) || 0 })}
                  disabled={loading}
                />
                <Button
                  onClick={addWorkshop}
                  disabled={loading}
                  className="md:col-span-1"
                >
                  {loading ? 'Adding...' : 'Add Workshop'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Workshops Table */}
          <Card>
            <CardHeader>
              <CardTitle>Workshops</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workshops.map((workshop) => (
                    <TableRow key={workshop._id}>
                      <TableCell>
                        {editingId === workshop._id ? (
                          <Input
                            value={workshop.title}
                            onChange={(e) => setWorkshops(workshops.map(w =>
                              w._id === workshop._id ? { ...w, title: e.target.value } : w
                            ))}
                            className="h-8"
                          />
                        ) : workshop.title}
                      </TableCell>
                      <TableCell>
                        {editingId === workshop._id ? (
                          <Input
                            type="date"
                            value={workshop.date}
                            onChange={(e) => setWorkshops(workshops.map(w =>
                              w._id === workshop._id ? { ...w, date: e.target.value } : w
                            ))}
                            className="h-8"
                          />
                        ) : workshop.date}
                      </TableCell>
                      <TableCell>
                        {editingId === workshop._id ? (
                          <Input
                            type="number"
                            value={workshop.actualParticipants}
                            onChange={(e) => setWorkshops(workshops.map(w =>
                              w._id === workshop._id ? { ...w, actualParticipants: parseInt(e.target.value) || 0 } : w
                            ))}
                            className="h-8"
                          />
                        ) : workshop.actualParticipants}
                      </TableCell>
                      <TableCell>
                        {editingId === workshop._id ? (
                          <Select
                            value={workshop.status}
                            onValueChange={(value) => setWorkshops(workshops.map(w =>
                              w._id === workshop._id ? { ...w, status: value as 'planned' | 'completed' } : w
                            ))}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="planned">📅 Planned</SelectItem>
                              <SelectItem value="completed">✅ Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={workshop.status === 'planned' ? 'default' : 'secondary'}>
                            {workshop.status === 'planned' ? '📅 Planned' : '✅ Completed'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === workshop._id ? (
                          <div className="flex gap-1">
                            <Button
                              onClick={() => updateWorkshop(workshop._id!, workshop)}
                              disabled={loading}
                              size="sm"
                              className="h-7"
                            >
                              {loading ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              onClick={() => setEditingId(null)}
                              disabled={loading}
                              variant="secondary"
                              size="sm"
                              className="h-7"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              onClick={() => setEditingId(workshop._id!)}
                              disabled={loading}
                              variant="outline"
                              size="sm"
                              className="h-7"
                            >
                              Edit
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  disabled={loading}
                                  variant="destructive"
                                  size="sm"
                                  className="h-7"
                                >
                                  Delete
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Delete Workshop</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete "{workshop.title}"? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => {}}>
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => deleteWorkshop(workshop._id!)}
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {!loading && workshops.length === 0 && (
            <Card>
              <CardContent className="text-center py-10 text-muted-foreground">
                No workshops scheduled yet. Add your first workshop above!
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="participants" className="space-y-6">
          {/* Workshop Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Workshop to Manage Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedWorkshopId || ''} onValueChange={(value) => setSelectedWorkshopId(value || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a workshop..." />
                </SelectTrigger>
                <SelectContent>
                  {workshops.map((workshop) => (
                    <SelectItem key={workshop._id} value={workshop._id}>
                      {workshop.title} - {workshop.date} at {workshop.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedWorkshopId && (
            <>
              {/* Add Participant Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Register New Participant</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="participant-name">Full Name *</Label>
                      <Input
                        id="participant-name"
                        placeholder="Enter participant's full name"
                        value={newParticipant.name}
                        onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="participant-age">Age *</Label>
                      <Input
                        id="participant-age"
                        type="number"
                        placeholder="Enter age"
                        value={newParticipant.age}
                        onChange={(e) => setNewParticipant({ ...newParticipant, age: parseInt(e.target.value) || 0 })}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="participant-phone">Phone Number *</Label>
                      <Input
                        id="participant-phone"
                        placeholder="Enter phone number"
                        value={newParticipant.phoneNumber}
                        onChange={(e) => setNewParticipant({ ...newParticipant, phoneNumber: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button
                      onClick={addParticipant}
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : 'Add Participant'}
                    </Button>
                  </div>

                  {/* Special Status Checkboxes */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-3">Special Status (check if applicable):</h4>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newParticipant.specialStatus.isDisabled}
                          onChange={(e) => setNewParticipant({
                            ...newParticipant,
                            specialStatus: { ...newParticipant.specialStatus, isDisabled: e.target.checked }
                          })}
                          disabled={loading}
                          className="rounded border-gray-300"
                        />
                        🦽 Disabled
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newParticipant.specialStatus.isWounded}
                          onChange={(e) => setNewParticipant({
                            ...newParticipant,
                            specialStatus: { ...newParticipant.specialStatus, isWounded: e.target.checked }
                          })}
                          disabled={loading}
                          className="rounded border-gray-300"
                        />
                        🩹 Wounded
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newParticipant.specialStatus.isSeparated}
                          onChange={(e) => setNewParticipant({
                            ...newParticipant,
                            specialStatus: { ...newParticipant.specialStatus, isSeparated: e.target.checked }
                          })}
                          disabled={loading}
                          className="rounded border-gray-300"
                        />
                        💔 Separated
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newParticipant.specialStatus.isUnaccompanied}
                          onChange={(e) => setNewParticipant({
                            ...newParticipant,
                            specialStatus: { ...newParticipant.specialStatus, isUnaccompanied: e.target.checked }
                          })}
                          disabled={loading}
                          className="rounded border-gray-300"
                        />
                        👤 Unaccompanied
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Participants List */}
              <Card>
                <CardHeader>
                  <CardTitle>Registered Participants ({participants.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {participants.length > 0 ? (
                    <div className="space-y-4">
                      {participants.map((participant) => (
                        <Card key={participant._id} className="bg-gray-50">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium mb-2">{participant.name}</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Age: {participant.age} | Phone: {participant.phoneNumber}
                                </p>
                                <div className="flex gap-2 flex-wrap mb-2">
                                  {participant.specialStatus.isDisabled && <Badge variant="secondary">🦽 Disabled</Badge>}
                                  {participant.specialStatus.isWounded && <Badge variant="destructive">🩹 Wounded</Badge>}
                                  {participant.specialStatus.isSeparated && <Badge variant="outline">💔 Separated</Badge>}
                                  {participant.specialStatus.isUnaccompanied && <Badge variant="default">👤 Unaccompanied</Badge>}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>Status:</span>
                                  <Badge
                                    variant={participant.attendanceStatus === 'attended' ? 'default' :
                                           participant.attendanceStatus === 'no-show' ? 'destructive' : 'secondary'}
                                  >
                                    {participant.attendanceStatus === 'registered' ? '📝 Registered' :
                                     participant.attendanceStatus === 'attended' ? '✅ Attended' : '❌ No Show'}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">Edit</Button>
                                <Button variant="destructive" size="sm">Remove</Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                      No participants registered yet. Add the first participant above!
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
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

              {/* Bulk Distribution Form */}
              {userBalances.filter(b => b.availableQuantity > 0).length > 0 && participants.length > 0 && (
                <div style={{ marginBottom: '20px', border: '1px solid #007cba', padding: '15px', borderRadius: '8px', backgroundColor: '#f0f8ff' }}>
                  <h3>🚀 Bulk Distribute to ALL Participants ({participants.length} people)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', alignItems: 'end' }}>
                    <div>
                      <Label htmlFor="bulk-material-select">Material</Label>
                      <select
                        id="bulk-material-select"
                        value={bulkDistribution.productId}
                        onChange={(e) => setBulkDistribution({ ...bulkDistribution, productId: e.target.value })}
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
                        disabled={loading}
                      >
                        <option value="">Select Material</option>
                        {userBalances.filter(b => b.availableQuantity > 0).map((balance) => (
                          <option key={balance.productId} value={balance.productId}>
                            {balance.productName} (Available: {balance.availableQuantity})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="bulk-quantity-input">Quantity per Participant</Label>
                      <input
                        id="bulk-quantity-input"
                        type="number"
                        placeholder="Enter quantity"
                        value={bulkDistribution.quantityPerParticipant}
                        onChange={(e) => setBulkDistribution({ ...bulkDistribution, quantityPerParticipant: parseInt(e.target.value) || 0 })}
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
                        disabled={loading}
                      />
                    </div>
                    <button
                      onClick={bulkDistributeMaterials}
                      disabled={loading || !bulkDistribution.productId || !bulkDistribution.quantityPerParticipant}
                      style={{
                        padding: '8px 15px',
                        backgroundColor: loading ? '#ccc' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      {loading ? 'Distributing...' : `Distribute to All ${participants.length}`}
                    </button>
                  </div>
                  {bulkDistribution.productId && bulkDistribution.quantityPerParticipant > 0 && (
                    <div style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
                      <p>📊 <strong>Distribution Summary:</strong></p>
                      <p>• {participants.length} participants × {bulkDistribution.quantityPerParticipant} = <strong>{participants.length * bulkDistribution.quantityPerParticipant} total units needed</strong></p>
                      <p>• Available: {userBalances.find(b => b.productId === bulkDistribution.productId)?.availableQuantity || 0} units</p>
                      {(participants.length * bulkDistribution.quantityPerParticipant) > (userBalances.find(b => b.productId === bulkDistribution.productId)?.availableQuantity || 0) && (
                        <p style={{ color: '#dc2626', fontWeight: 'bold' }}>⚠️ Insufficient quantity!</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Individual Material Distribution Form */}
              {userBalances.filter(b => b.availableQuantity > 0).length > 0 && participants.length > 0 && (
                <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                  <h3>🎯 Distribute Materials to Individual Participant</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', alignItems: 'end' }}>
                    <div>
                      <Label htmlFor="participant-select">Participant</Label>
                      <select
                        id="participant-select"
                        value={selectedParticipantForDistribution || ''}
                        onChange={(e) => setSelectedParticipantForDistribution(e.target.value || null)}
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
                        disabled={loading}
                      >
                        <option value="">Select Participant</option>
                        {participants.map((participant) => (
                          <option key={participant._id} value={participant._id}>
                            {participant.name} (Age: {participant.age})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="individual-material-select">Material</Label>
                      <select
                        id="individual-material-select"
                        value={materialDistribution.productId}
                        onChange={(e) => setMaterialDistribution({ ...materialDistribution, productId: e.target.value })}
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
                        disabled={loading}
                      >
                        <option value="">Select Material</option>
                        {userBalances.filter(b => b.availableQuantity > 0).map((balance) => (
                          <option key={balance.productId} value={balance.productId}>
                            {balance.productName} (Available: {balance.availableQuantity})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="individual-quantity-input">Quantity</Label>
                      <input
                        id="individual-quantity-input"
                        type="number"
                        placeholder="Enter quantity"
                        value={materialDistribution.quantity}
                        max={userBalances.find(b => b.productId === materialDistribution.productId)?.availableQuantity || 0}
                        onChange={(e) => setMaterialDistribution({ ...materialDistribution, quantity: parseInt(e.target.value) || 0 })}
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
                        disabled={loading}
                      />
                    </div>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}