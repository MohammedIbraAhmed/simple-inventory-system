'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Program, Session, ProgramParticipant, SessionAttendance, Location, UserBalance, Product } from '@/types/product'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NumberInput } from '@/components/ui/number-input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { LocationSelect } from '@/components/location-select'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

export default function ProgramsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [programs, setPrograms] = useState<Program[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [participants, setParticipants] = useState<ProgramParticipant[]>([])
  const [attendance, setAttendance] = useState<SessionAttendance[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [newProgram, setNewProgram] = useState({
    title: '',
    description: '',
    objectives: [''],
    startDate: '',
    endDate: '',
    totalSessions: 1,
    minimumSessionsForCompletion: 1,
    locationId: '',
    expectedParticipants: 0,
    status: 'planned' as 'planned' | 'ongoing' | 'completed' | 'cancelled'
  })
  const [newSession, setNewSession] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    objectives: [''],
    expectedParticipants: 0
  })
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    age: 0,
    gender: '' as 'male' | 'female' | 'other' | '',
    idNumber: '',
    phoneNumber: '',
    specialStatus: {
      isDisabled: false,
      isWounded: false,
      isSeparated: false,
      isUnaccompanied: false
    }
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'programs' | 'sessions' | 'participants' | 'attendance' | 'materials'>('programs')

  // Material distribution state
  const [userBalances, setUserBalances] = useState<UserBalance[]>([])
  const [products, setProducts] = useState<Product[]>([])
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
    fetchPrograms()
    fetchUserBalances()
    fetchProducts()
  }, [session, status, router])

  useEffect(() => {
    if (selectedProgramId) {
      fetchSessions()
      fetchParticipants()
    }
  }, [selectedProgramId])

  useEffect(() => {
    if (selectedSessionId) {
      fetchAttendance()
    }
  }, [selectedSessionId])

  async function fetchPrograms() {
    setLoading(true)
    try {
      const res = await fetch('/api/programs')
      const data = await res.json()
      setPrograms(data)
    } catch (err) {
      toast.error('Failed to fetch programs')
    } finally {
      setLoading(false)
    }
  }

  async function fetchSessions() {
    if (!selectedProgramId) return
    try {
      const res = await fetch(`/api/sessions?programId=${selectedProgramId}`)
      const data = await res.json()
      setSessions(data)
    } catch (err) {
      // Silent fail for sessions
    }
  }

  async function fetchParticipants() {
    if (!selectedProgramId) return
    try {
      const res = await fetch(`/api/program-participants?programId=${selectedProgramId}`)
      const data = await res.json()
      setParticipants(data)
    } catch (err) {
      // Silent fail for participants
    }
  }

  async function fetchAttendance() {
    if (!selectedSessionId) return
    try {
      const res = await fetch(`/api/session-attendance?sessionId=${selectedSessionId}`)
      const data = await res.json()
      setAttendance(data)
    } catch (err) {
      // Silent fail for attendance
    }
  }

  async function fetchUserBalances() {
    try {
      const res = await fetch('/api/user-balances')
      const data = await res.json()
      setUserBalances(data)
    } catch (err) {
      toast.error('Failed to fetch user balances')
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      toast.error('Failed to fetch products')
    }
  }

  async function distributeSessionMaterial() {
    if (!selectedParticipantForDistribution || !materialDistribution.productId || !materialDistribution.quantity || !selectedSessionId) {
      toast.error('Please select participant, product, quantity, and ensure session is selected')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/distribute-materials/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programParticipantId: selectedParticipantForDistribution,
          productId: materialDistribution.productId,
          quantity: materialDistribution.quantity,
          sessionId: selectedSessionId
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
      fetchAttendance()
    } catch (err) {
      toast.error('Failed to distribute materials')
    } finally {
      setLoading(false)
    }
  }

  async function bulkDistributeSessionMaterials() {
    if (!bulkDistribution.productId || !bulkDistribution.quantityPerParticipant || !selectedSessionId) {
      toast.error('Please select product, quantity per participant, and ensure session is selected')
      return
    }

    const sessionAttendees = attendance.filter(a => ['attended', 'late', 'left-early'].includes(a.attendanceStatus))
    if (sessionAttendees.length === 0) {
      toast.error('No attendees found for this session')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/distribute-materials/session/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          productId: bulkDistribution.productId,
          quantityPerParticipant: bulkDistribution.quantityPerParticipant
        })
      })

      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || 'Failed to bulk distribute materials')
        return
      }

      toast.success(`Successfully distributed ${result.distributed.totalQuantity} ${result.distributed.productName} to ${result.distributed.participantCount} attendees in ${result.distributed.sessionTitle}`)

      setBulkDistribution({ productId: '', quantityPerParticipant: 0 })
      fetchUserBalances()
      fetchAttendance()
    } catch (err) {
      toast.error('Failed to bulk distribute materials')
    } finally {
      setLoading(false)
    }
  }

  async function updateSessionStatus(sessionId: string, newStatus: 'planned' | 'ongoing' | 'completed' | 'cancelled') {
    if (!sessionId) return

    setLoading(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || 'Failed to update session status')
        return
      }

      toast.success(`Session status updated to ${newStatus}`)
      fetchSessions() // Refresh the sessions list
    } catch (err) {
      toast.error('Failed to update session status')
    } finally {
      setLoading(false)
    }
  }

  async function updateAttendanceStatus(participantId: string, status: 'registered' | 'attended' | 'absent' | 'late' | 'left-early') {
    if (!selectedSessionId) {
      toast.error('Please select a session first')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/session-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          programParticipantId: participantId,
          attendanceStatus: status,
          checkInTime: status !== 'absent' ? new Date().toISOString() : undefined,
          recordedBy: session?.user?.id,
          recordedAt: new Date().toISOString()
        })
      })

      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || 'Failed to update attendance')
        return
      }

      toast.success(`Attendance updated successfully`)
      fetchAttendance() // Refresh attendance data
    } catch (err) {
      toast.error('Failed to update attendance')
    } finally {
      setLoading(false)
    }
  }

  async function addProgram() {
    if (!newProgram.title || !newProgram.startDate || !newProgram.endDate || !newProgram.locationId) {
      toast.error('Title, start date, end date, and location are required')
      return
    }

    if (new Date(newProgram.endDate) <= new Date(newProgram.startDate)) {
      toast.error('End date must be after start date')
      return
    }

    if (newProgram.minimumSessionsForCompletion > newProgram.totalSessions) {
      toast.error('Minimum sessions for completion cannot exceed total sessions')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProgram,
          objectives: newProgram.objectives.filter(obj => obj.trim() !== '')
        })
      })

      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || 'Failed to create program')
        return
      }

      toast.success('Program created successfully!')
      setNewProgram({
        title: '',
        description: '',
        objectives: [''],
        startDate: '',
        endDate: '',
        totalSessions: 1,
        minimumSessionsForCompletion: 1,
        locationId: '',
        expectedParticipants: 0,
        status: 'planned'
      })
      fetchPrograms()
    } catch (err) {
      toast.error('Failed to create program')
    } finally {
      setLoading(false)
    }
  }

  async function addSession() {
    if (!selectedProgramId || !newSession.title || !newSession.date || !newSession.startTime || !newSession.endTime) {
      toast.error('Please select a program and fill in all required session fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSession,
          programId: selectedProgramId,
          objectives: newSession.objectives.filter(obj => obj.trim() !== '')
        })
      })

      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || 'Failed to create session')
        return
      }

      toast.success('Session created successfully!')
      setNewSession({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        objectives: [''],
        expectedParticipants: 0
      })
      fetchSessions()
    } catch (err) {
      toast.error('Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  async function enrollParticipant() {
    if (!selectedProgramId || !newParticipant.name || !newParticipant.age || !newParticipant.gender || !newParticipant.idNumber || !newParticipant.phoneNumber) {
      toast.error('Please select a program and fill in all required participant fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/program-participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: selectedProgramId,
          ...newParticipant
        })
      })

      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || 'Failed to enroll participant')
        return
      }

      toast.success(`${newParticipant.name} enrolled successfully!`)
      setNewParticipant({
        name: '',
        age: 0,
        gender: '' as 'male' | 'female' | 'other' | '',
        idNumber: '',
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
      toast.error('Failed to enroll participant')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') return <div>Loading...</div>
  if (!session) return null

  const plannedPrograms = programs.filter(p => p.status === 'planned')
  const ongoingPrograms = programs.filter(p => p.status === 'ongoing')
  const completedPrograms = programs.filter(p => p.status === 'completed')
  const totalParticipants = programs.reduce((sum, p) => sum + (p.enrolledParticipants || 0), 0)

  const selectedProgram = programs.find(p => p._id === selectedProgramId)

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">📚 Program Management</h1>
        <p className="text-muted-foreground">
          Create and manage multi-session programs with participant tracking
        </p>
      </div>

      {/* Program Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <CardTitle className="text-blue-800 text-sm mb-1">📋 Planned</CardTitle>
            <p className="text-2xl font-bold text-blue-800">{plannedPrograms.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <CardTitle className="text-yellow-600 text-sm mb-1">🔄 Ongoing</CardTitle>
            <p className="text-2xl font-bold text-yellow-600">{ongoingPrograms.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <CardTitle className="text-green-700 text-sm mb-1">✅ Completed</CardTitle>
            <p className="text-2xl font-bold text-green-700">{completedPrograms.length}</p>
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
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="mb-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-5 h-auto md:h-10">
          <TabsTrigger value="programs">📚 Programs</TabsTrigger>
          <TabsTrigger value="sessions">🎯 Sessions</TabsTrigger>
          <TabsTrigger value="participants">👥 Participants</TabsTrigger>
          <TabsTrigger value="attendance">📋 Attendance</TabsTrigger>
          <TabsTrigger value="materials">📦 Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-6">
          {/* Add Program Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Program</CardTitle>
              <CardDescription>
                Programs are multi-session activities targeting the same participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="program-title">Program Title *</Label>
                  <Input
                    id="program-title"
                    placeholder="Enter program title"
                    value={newProgram.title}
                    onChange={(e) => setNewProgram({ ...newProgram, title: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="program-location">Location *</Label>
                  <LocationSelect
                    value={newProgram.locationId}
                    onValueChange={(locationId) => setNewProgram({ ...newProgram, locationId })}
                    placeholder="Select Location"
                    disabled={loading}
                  />
                </div>
                <div className="md:col-span-3">
                  <Label htmlFor="program-description">Description</Label>
                  <Textarea
                    id="program-description"
                    placeholder="Describe the program purpose and activities"
                    value={newProgram.description}
                    onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="program-start">Start Date *</Label>
                  <Input
                    id="program-start"
                    type="date"
                    value={newProgram.startDate}
                    onChange={(e) => setNewProgram({ ...newProgram, startDate: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="program-end">End Date *</Label>
                  <Input
                    id="program-end"
                    type="date"
                    value={newProgram.endDate}
                    onChange={(e) => setNewProgram({ ...newProgram, endDate: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="program-participants">Expected Participants</Label>
                  <NumberInput
                    id="program-participants"
                    placeholder="Expected participants"
                    value={newProgram.expectedParticipants}
                    onChange={(value) => setNewProgram({ ...newProgram, expectedParticipants: value })}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="program-total-sessions">Total Sessions</Label>
                  <NumberInput
                    id="program-total-sessions"
                    placeholder="Total sessions"
                    value={newProgram.totalSessions}
                    onChange={(value) => setNewProgram({ ...newProgram, totalSessions: value })}
                    disabled={loading}
                    min={1}
                  />
                </div>
                <div>
                  <Label htmlFor="program-min-sessions">Min Sessions for Completion</Label>
                  <NumberInput
                    id="program-min-sessions"
                    placeholder="Minimum sessions"
                    value={newProgram.minimumSessionsForCompletion}
                    onChange={(value) => setNewProgram({ ...newProgram, minimumSessionsForCompletion: value })}
                    disabled={loading}
                    min={1}
                    max={newProgram.totalSessions}
                  />
                </div>
                <div className="md:col-span-3">
                  <Label>Program Objectives</Label>
                  {newProgram.objectives.map((objective, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <Input
                        placeholder={`Objective ${index + 1}`}
                        value={objective}
                        onChange={(e) => {
                          const newObjectives = [...newProgram.objectives]
                          newObjectives[index] = e.target.value
                          setNewProgram({ ...newProgram, objectives: newObjectives })
                        }}
                        disabled={loading}
                      />
                      {index === newProgram.objectives.length - 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setNewProgram({
                            ...newProgram,
                            objectives: [...newProgram.objectives, '']
                          })}
                          disabled={loading}
                        >
                          +
                        </Button>
                      )}
                      {newProgram.objectives.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const newObjectives = newProgram.objectives.filter((_, i) => i !== index)
                            setNewProgram({ ...newProgram, objectives: newObjectives })
                          }}
                          disabled={loading}
                        >
                          -
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="md:col-span-3">
                  <Button
                    onClick={addProgram}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Creating...' : 'Create Program'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Programs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((program) => (
                    <TableRow key={program._id}>
                      <TableCell>
                        <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {program.programCode || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{program.title}</div>
                          <div className="text-sm text-muted-foreground">{program.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {program.startDate} to {program.endDate}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {program.completedSessions || 0} / {program.totalSessions}
                          {program.totalSessions > 0 && (
                            <Progress
                              value={((program.completedSessions || 0) / program.totalSessions) * 100}
                              className="w-16 mt-1"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {program.enrolledParticipants || 0} enrolled
                          <br />
                          <span className="text-muted-foreground">
                            {program.completedParticipants || 0} completed
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          program.status === 'planned' ? 'default' :
                          program.status === 'ongoing' ? 'secondary' :
                          program.status === 'completed' ? 'outline' : 'destructive'
                        }>
                          {program.status === 'planned' ? '📋 Planned' :
                           program.status === 'ongoing' ? '🔄 Ongoing' :
                           program.status === 'completed' ? '✅ Completed' : '❌ Cancelled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => {
                              setSelectedProgramId(program._id!)
                              setActiveTab('sessions')
                            }}
                            variant="outline"
                            size="sm"
                            className="h-7"
                          >
                            Manage
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {!loading && programs.length === 0 && (
            <Card>
              <CardContent className="text-center py-10 text-muted-foreground">
                No programs created yet. Create your first program above!
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          {/* Program Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Program to Manage Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedProgramId || ''} onValueChange={setSelectedProgramId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a program..." />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program._id} value={program._id!}>
                      [{program.programCode}] {program.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedProgramId && selectedProgram && (
            <>
              {/* Program Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Program: {selectedProgram.title}</CardTitle>
                  <CardDescription>
                    Sessions: {sessions.length} / {selectedProgram.totalSessions} |
                    Duration: {selectedProgram.startDate} to {selectedProgram.endDate}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Add Session Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Schedule New Session</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="session-title">Session Title *</Label>
                      <Input
                        id="session-title"
                        placeholder="Enter session title"
                        value={newSession.title}
                        onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="session-participants">Expected Participants</Label>
                      <NumberInput
                        id="session-participants"
                        placeholder="Expected participants"
                        value={newSession.expectedParticipants}
                        onChange={(value) => setNewSession({ ...newSession, expectedParticipants: value })}
                        disabled={loading}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label htmlFor="session-description">Description</Label>
                      <Textarea
                        id="session-description"
                        placeholder="Describe this session"
                        value={newSession.description}
                        onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="session-date">Date *</Label>
                      <Input
                        id="session-date"
                        type="date"
                        value={newSession.date}
                        onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                        disabled={loading}
                        min={selectedProgram.startDate}
                        max={selectedProgram.endDate}
                      />
                    </div>
                    <div>
                      <Label htmlFor="session-start">Start Time *</Label>
                      <Input
                        id="session-start"
                        type="time"
                        value={newSession.startTime}
                        onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="session-end">End Time *</Label>
                      <Input
                        id="session-end"
                        type="time"
                        value={newSession.endTime}
                        onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Button
                        onClick={addSession}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? 'Creating...' : 'Create Session'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sessions List */}
              <Card>
                <CardHeader>
                  <CardTitle>Program Sessions ({sessions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {sessions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Session #</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Attendance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessions.map((session) => (
                          <TableRow key={session._id}>
                            <TableCell>
                              <Badge variant="outline">#{session.sessionNumber}</Badge>
                            </TableCell>
                            <TableCell>{session.title}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {session.date}
                                <br />
                                {session.startTime} - {session.endTime}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {session.actualParticipants || 0} / {session.expectedParticipants}
                                {session.attendanceRate && (
                                  <div className="text-muted-foreground">
                                    {session.attendanceRate}% rate
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={session.status === 'planned' ? 'default' : 'secondary'}>
                                {session.status === 'planned' ? '📅 Planned' : '✅ Completed'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {session.status === 'planned' && (
                                  <Button
                                    onClick={() => updateSessionStatus(session._id!, 'completed')}
                                    variant="outline"
                                    size="sm"
                                    className="bg-green-50 hover:bg-green-100 text-green-700"
                                    disabled={loading}
                                  >
                                    Mark Complete
                                  </Button>
                                )}
                                <Button
                                  onClick={() => {
                                    setSelectedSessionId(session._id!)
                                    setActiveTab('attendance')
                                  }}
                                  variant="outline"
                                  size="sm"
                                >
                                  Attendance
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                      No sessions scheduled yet. Create the first session above!
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="participants" className="space-y-6">
          {/* Program Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Program to Manage Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedProgramId || ''} onValueChange={setSelectedProgramId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a program..." />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program._id} value={program._id!}>
                      [{program.programCode}] {program.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedProgramId && (
            <>
              {/* Enroll Participant Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Enroll New Participant</CardTitle>
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
                      <NumberInput
                        id="participant-age"
                        placeholder="Enter age"
                        value={newParticipant.age}
                        onChange={(value) => setNewParticipant({ ...newParticipant, age: value })}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="participant-gender">Gender *</Label>
                      <Select
                        value={newParticipant.gender}
                        onValueChange={(value) => setNewParticipant({ ...newParticipant, gender: value as 'male' | 'female' | 'other' })}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">👨 Male</SelectItem>
                          <SelectItem value="female">👩 Female</SelectItem>
                          <SelectItem value="other">🏳️‍⚧️ Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="participant-id">ID Number *</Label>
                      <Input
                        id="participant-id"
                        placeholder="Enter national ID or identification number"
                        value={newParticipant.idNumber}
                        onChange={(e) => setNewParticipant({ ...newParticipant, idNumber: e.target.value })}
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

                  <div className="mt-4">
                    <Button
                      onClick={enrollParticipant}
                      disabled={loading}
                    >
                      {loading ? 'Enrolling...' : 'Enroll Participant'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Participants List */}
              <Card>
                <CardHeader>
                  <CardTitle>Enrolled Participants ({participants.length})</CardTitle>
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
                                  Age: {participant.age} |
                                  {participant.gender === 'male' ? ' 👨' : participant.gender === 'female' ? ' 👩' : ' 🏳️‍⚧️'} {participant.gender} |
                                  ID: {participant.idNumber} |
                                  Phone: {participant.phoneNumber}
                                </p>
                                <div className="flex gap-2 flex-wrap mb-2">
                                  {participant.specialStatus?.isDisabled && <Badge variant="secondary">🦽 Disabled</Badge>}
                                  {participant.specialStatus?.isWounded && <Badge variant="destructive">🩹 Wounded</Badge>}
                                  {participant.specialStatus?.isSeparated && <Badge variant="outline">💔 Separated</Badge>}
                                  {participant.specialStatus?.isUnaccompanied && <Badge variant="default">👤 Unaccompanied</Badge>}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>Status:</span>
                                  <Badge variant={participant.status === 'completed' ? 'default' : 'secondary'}>
                                    {participant.status === 'enrolled' ? '📝 Enrolled' :
                                     participant.status === 'active' ? '✅ Active' :
                                     participant.status === 'completed' ? '🎓 Completed' :
                                     participant.status === 'dropped-out' ? '❌ Dropped Out' : participant.status}
                                  </Badge>
                                  <span>Attendance: {participant.attendanceRate || 0}%</span>
                                  <span>Sessions: {participant.sessionsAttended || 0}/{selectedProgram?.totalSessions}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                      No participants enrolled yet. Enroll the first participant above!
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          {/* Session Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Session to Manage Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={selectedProgramId || ''} onValueChange={setSelectedProgramId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a program..." />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program._id} value={program._id!}>
                        [{program.programCode}] {program.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedProgramId && sessions.length > 0 && (
                  <Select value={selectedSessionId || ''} onValueChange={setSelectedSessionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a session..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((session) => (
                        <SelectItem key={session._id} value={session._id!}>
                          Session #{session.sessionNumber}: {session.title} - {session.date}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedSessionId && (
            <Card>
              <CardHeader>
                <CardTitle>Attendance Management</CardTitle>
                <CardDescription>
                  Track attendance for session participants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {participants.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        Track attendance for {participants.length} enrolled participants in this session
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Participant</TableHead>
                            <TableHead>Age/Gender</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {participants.map((participant) => {
                            const attendanceRecord = attendance.find(a => a.programParticipantId === participant._id)
                            return (
                              <TableRow key={participant._id}>
                                <TableCell className="font-medium">
                                  {participant.name}
                                  <div className="text-xs text-muted-foreground">
                                    ID: {participant.idNumber}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {participant.age} years • {participant.gender === 'male' ? '👨' : participant.gender === 'female' ? '👩' : '🏳️‍⚧️'}
                                  </div>
                                  {(participant.specialStatus?.isDisabled || participant.specialStatus?.isWounded || participant.specialStatus?.isSeparated || participant.specialStatus?.isUnaccompanied) && (
                                    <div className="text-xs flex gap-1">
                                      {participant.specialStatus.isDisabled && <span>🦽</span>}
                                      {participant.specialStatus.isWounded && <span>🩹</span>}
                                      {participant.specialStatus.isSeparated && <span>💔</span>}
                                      {participant.specialStatus.isUnaccompanied && <span>👤</span>}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {attendanceRecord ? (
                                    <Badge variant={
                                      attendanceRecord.attendanceStatus === 'attended' ? 'default' :
                                      ['late', 'left-early'].includes(attendanceRecord.attendanceStatus) ? 'secondary' :
                                      attendanceRecord.attendanceStatus === 'absent' ? 'destructive' :
                                      'outline'
                                    }>
                                      {attendanceRecord.attendanceStatus}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">Not recorded</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1 flex-wrap">
                                    <Button
                                      onClick={() => updateAttendanceStatus(participant._id!, 'attended')}
                                      variant="outline"
                                      size="sm"
                                      className="h-7 bg-green-50 hover:bg-green-100 text-green-700 text-xs"
                                      disabled={loading}
                                    >
                                      Present
                                    </Button>
                                    <Button
                                      onClick={() => updateAttendanceStatus(participant._id!, 'late')}
                                      variant="outline"
                                      size="sm"
                                      className="h-7 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-xs"
                                      disabled={loading}
                                    >
                                      Late
                                    </Button>
                                    <Button
                                      onClick={() => updateAttendanceStatus(participant._id!, 'absent')}
                                      variant="outline"
                                      size="sm"
                                      className="h-7 bg-red-50 hover:bg-red-100 text-red-700 text-xs"
                                      disabled={loading}
                                    >
                                      Absent
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                      No participants enrolled in this program yet.
                      <br />
                      Go to the Participants tab to enroll participants first.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
          {/* Session Selection for Materials */}
          <Card>
            <CardHeader>
              <CardTitle>Select Session for Material Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={selectedProgramId || ''} onValueChange={setSelectedProgramId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a program..." />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program._id} value={program._id!}>
                        [{program.programCode}] {program.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProgramId && sessions.length > 0 && (
                  <Select value={selectedSessionId || ''} onValueChange={setSelectedSessionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a session..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((session) => (
                        <SelectItem key={session._id} value={session._id!}>
                          Session #{session.sessionNumber}: {session.title} - {session.date}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedSessionId && (
            <>
              {/* User Available Materials */}
              {userBalances.filter(b => b.availableQuantity > 0).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>📦 My Available Materials</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userBalances.filter(b => b.availableQuantity > 0).map((balance) => (
                        <div key={balance._id} className="border rounded-lg p-4 bg-muted/50">
                          <h4 className="font-medium text-sm">{balance.productName}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Available: <span className="font-bold text-green-600">{balance.availableQuantity}</span> units
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Bulk Distribution */}
              {userBalances.filter(b => b.availableQuantity > 0).length > 0 && attendance.filter(a => ['attended', 'late', 'left-early'].includes(a.attendanceStatus)).length > 0 && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="text-blue-800">🚀 Bulk Distribute to ALL Attendees</CardTitle>
                    <CardDescription className="text-blue-600">
                      Distribute materials to {attendance.filter(a => ['attended', 'late', 'left-early'].includes(a.attendanceStatus)).length} session attendees
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <Label htmlFor="bulk-material-select">Select Material</Label>
                        <Select
                          value={bulkDistribution.productId}
                          onValueChange={(value) => setBulkDistribution({ ...bulkDistribution, productId: value })}
                          disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose material..." />
                          </SelectTrigger>
                          <SelectContent>
                            {userBalances.filter(b => b.availableQuantity > 0).map((balance) => (
                              <SelectItem key={balance.productId} value={balance.productId}>
                                {balance.productName} (Available: {balance.availableQuantity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="bulk-quantity-input">Quantity per Person</Label>
                        <NumberInput
                          placeholder="Enter quantity"
                          value={bulkDistribution.quantityPerParticipant}
                          onChange={(value) => setBulkDistribution({ ...bulkDistribution, quantityPerParticipant: value })}
                          disabled={loading}
                        />
                      </div>
                      <Button
                        onClick={bulkDistributeSessionMaterials}
                        disabled={loading || !bulkDistribution.productId || !bulkDistribution.quantityPerParticipant}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {loading ? 'Distributing...' : 'Bulk Distribute'}
                      </Button>
                    </div>
                    {bulkDistribution.productId && bulkDistribution.quantityPerParticipant > 0 && (
                      <div className="mt-4 p-3 bg-blue-100 rounded-lg border">
                        <p className="text-sm"><strong>Distribution Summary:</strong></p>
                        <p className="text-sm">• {attendance.filter(a => ['attended', 'late', 'left-early'].includes(a.attendanceStatus)).length} attendees × {bulkDistribution.quantityPerParticipant} = <strong>{attendance.filter(a => ['attended', 'late', 'left-early'].includes(a.attendanceStatus)).length * bulkDistribution.quantityPerParticipant} total units needed</strong></p>
                        <p className="text-sm">• Available: {userBalances.find(b => b.productId === bulkDistribution.productId)?.availableQuantity || 0} units</p>
                        {(attendance.filter(a => ['attended', 'late', 'left-early'].includes(a.attendanceStatus)).length * bulkDistribution.quantityPerParticipant) > (userBalances.find(b => b.productId === bulkDistribution.productId)?.availableQuantity || 0) && (
                          <p className="text-sm text-red-600 font-bold">⚠️ Insufficient quantity!</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Individual Distribution */}
              {userBalances.filter(b => b.availableQuantity > 0).length > 0 && attendance.filter(a => ['attended', 'late', 'left-early'].includes(a.attendanceStatus)).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>🎯 Distribute Materials to Individual Participant</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div>
                        <Label>Select Participant</Label>
                        <Select
                          value={selectedParticipantForDistribution || ''}
                          onValueChange={setSelectedParticipantForDistribution}
                          disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose participant..." />
                          </SelectTrigger>
                          <SelectContent>
                            {attendance.filter(a => ['attended', 'late', 'left-early'].includes(a.attendanceStatus)).map((att) => (
                              <SelectItem key={att.programParticipantId} value={att.programParticipantId}>
                                {att.participantName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Select Material</Label>
                        <Select
                          value={materialDistribution.productId}
                          onValueChange={(value) => setMaterialDistribution({ ...materialDistribution, productId: value })}
                          disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose material..." />
                          </SelectTrigger>
                          <SelectContent>
                            {userBalances.filter(b => b.availableQuantity > 0).map((balance) => (
                              <SelectItem key={balance.productId} value={balance.productId}>
                                {balance.productName} (Available: {balance.availableQuantity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <NumberInput
                          placeholder="Enter quantity"
                          value={materialDistribution.quantity}
                          max={userBalances.find(b => b.productId === materialDistribution.productId)?.availableQuantity || 0}
                          onChange={(value) => setMaterialDistribution({ ...materialDistribution, quantity: value })}
                          disabled={loading}
                        />
                      </div>
                      <Button
                        onClick={distributeSessionMaterial}
                        disabled={loading || !selectedParticipantForDistribution || !materialDistribution.productId || !materialDistribution.quantity}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? 'Distributing...' : 'Distribute'}
                      </Button>
                    </div>
                    {materialDistribution.productId && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Available: {userBalances.find(b => b.productId === materialDistribution.productId)?.availableQuantity || 0} units
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Session Materials Summary */}
              {attendance.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>📋 Session Attendees & Materials</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Participant</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Materials Received</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendance.map((att) => (
                          <TableRow key={att._id}>
                            <TableCell className="font-medium">{att.participantName}</TableCell>
                            <TableCell>
                              <Badge variant={
                                att.attendanceStatus === 'attended' ? 'default' :
                                ['late', 'left-early'].includes(att.attendanceStatus) ? 'secondary' :
                                'destructive'
                              }>
                                {att.attendanceStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {att.sessionMaterialsReceived?.length > 0 ? (
                                <div className="space-y-1">
                                  {att.sessionMaterialsReceived.map((material, idx) => (
                                    <div key={idx} className="text-xs bg-green-50 px-2 py-1 rounded border">
                                      {material.quantity}x {material.productName}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">No materials yet</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* No attendees message */}
              {attendance.filter(a => ['attended', 'late', 'left-early'].includes(a.attendanceStatus)).length === 0 && (
                <Card>
                  <CardContent className="text-center py-10 text-muted-foreground">
                    No attendees found for this session. Please ensure attendance has been recorded before distributing materials.
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* No session selected */}
          {!selectedSessionId && (
            <Card>
              <CardContent className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                Please select a program and session above to manage material distribution.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}