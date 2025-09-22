'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Location } from '@/types/product'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { MapPin, Plus, Edit, Trash2, Users, Baby, Phone, Navigation } from 'lucide-react'
import { getNeighborhoods } from '@/lib/neighborhoods'

export default function LocationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)

  const [newLocation, setNewLocation] = useState({
    name: '',
    type: '',
    governorate: '',
    neighborhood: '',
    gpsCoordinates: {
      latitude: 31.5, // Default to Gaza Strip center
      longitude: 34.5
    },
    siteManager: {
      name: '',
      phoneNumber: ''
    },
    demographics: {
      numberOfPeople: 0,
      numberOfChildren: 0
    }
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (session.user.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchLocations()
  }, [session, status, router])

  const fetchLocations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/locations')
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      } else {
        toast.error('Failed to fetch locations')
      }
    } catch (error) {
      toast.error('Failed to fetch locations')
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setNewLocation(prev => ({
            ...prev,
            gpsCoordinates: { latitude, longitude }
          }))
          toast.success('GPS coordinates updated!')
        },
        (error) => {
          toast.error('Unable to get GPS location. Please enter coordinates manually.')
        }
      )
    } else {
      toast.error('GPS not supported by this browser')
    }
  }

  const addLocation = async () => {
    if (!newLocation.name || !newLocation.type || !newLocation.governorate || !newLocation.neighborhood || !newLocation.siteManager.name || !newLocation.siteManager.phoneNumber) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLocation)
      })

      const result = await response.json()
      if (response.ok) {
        toast.success('Location created successfully!')
        setShowAddDialog(false)
        resetForm()
        fetchLocations()
      } else {
        toast.error(result.error || 'Failed to create location')
      }
    } catch (error) {
      toast.error('Failed to create location')
    } finally {
      setLoading(false)
    }
  }

  const updateLocation = async () => {
    if (!editingLocation) return

    setLoading(true)
    try {
      const response = await fetch(`/api/locations/${editingLocation._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingLocation)
      })

      const result = await response.json()
      if (response.ok) {
        toast.success('Location updated successfully!')
        setShowEditDialog(false)
        setEditingLocation(null)
        fetchLocations()
      } else {
        toast.error(result.error || 'Failed to update location')
      }
    } catch (error) {
      toast.error('Failed to update location')
    } finally {
      setLoading(false)
    }
  }

  const deleteLocation = async (locationId: string, locationName: string) => {
    if (!confirm(`Are you sure you want to delete "${locationName}"? This action cannot be undone.`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (response.ok) {
        toast.success('Location deleted successfully!')
        fetchLocations()
      } else {
        toast.error(result.error || 'Failed to delete location')
      }
    } catch (error) {
      toast.error('Failed to delete location')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setNewLocation({
      name: '',
      type: '',
      governorate: '',
      neighborhood: '',
      gpsCoordinates: {
        latitude: 31.5,
        longitude: 34.5
      },
      siteManager: {
        name: '',
        phoneNumber: ''
      },
      demographics: {
        numberOfPeople: 0,
        numberOfChildren: 0
      }
    })
  }

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.governorate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.siteManager.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (status === 'loading') return <div>Loading...</div>
  if (!session || session.user.role !== 'admin') return null

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">📍 Location Management</h1>
        <p className="text-muted-foreground">
          Manage locations across Gaza Strip for workshop planning
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <CardTitle className="text-blue-800 text-sm mb-1">📍 Total Locations</CardTitle>
            <p className="text-2xl font-bold text-blue-800">{locations.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <CardTitle className="text-green-700 text-sm mb-1">👥 Total People</CardTitle>
            <p className="text-2xl font-bold text-green-700">
              {locations.reduce((sum, loc) => sum + loc.demographics.numberOfPeople, 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <CardTitle className="text-orange-600 text-sm mb-1">👶 Total Children</CardTitle>
            <p className="text-2xl font-bold text-orange-600">
              {locations.reduce((sum, loc) => sum + loc.demographics.numberOfChildren, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Add */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gaza Strip Locations</CardTitle>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Location</DialogTitle>
                  <DialogDescription>
                    Create a new location in Gaza Strip for workshop management
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location-name">Location Name *</Label>
                    <Input
                      id="location-name"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      placeholder="e.g., Community Center Al-Shifa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location-type">Location Type *</Label>
                    <Select value={newLocation.type} onValueChange={(value) => setNewLocation({ ...newLocation, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Collective_Centres_Non_UNRWA_Shelters">Collective Centres Non-UNRWA Shelters</SelectItem>
                        <SelectItem value="Collective_Centres_UNRWA_Shelters">Collective Centres UNRWA Shelters</SelectItem>
                        <SelectItem value="Makeshift_Shelters">Makeshift Shelters</SelectItem>
                        <SelectItem value="Scattered_Site">Scattered Site</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="governorate">Governorate *</Label>
                    <Select value={newLocation.governorate} onValueChange={(value) => setNewLocation({ ...newLocation, governorate: value, neighborhood: '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select governorate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="North Gaza">North Gaza</SelectItem>
                        <SelectItem value="Gaza">Gaza</SelectItem>
                        <SelectItem value="Deir al Balah">Deir al Balah</SelectItem>
                        <SelectItem value="Khan Yunis">Khan Yunis</SelectItem>
                        <SelectItem value="Rafah">Rafah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="neighborhood">Neighborhood *</Label>
                    <Select
                      value={newLocation.neighborhood}
                      onValueChange={(value) => setNewLocation({ ...newLocation, neighborhood: value })}
                      disabled={!newLocation.governorate}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={newLocation.governorate ? "Select neighborhood" : "Select governorate first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {getNeighborhoods(newLocation.governorate).map((neighborhood) => (
                          <SelectItem key={neighborhood} value={neighborhood}>
                            {neighborhood}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="manager-name">Site Manager Name *</Label>
                    <Input
                      id="manager-name"
                      value={newLocation.siteManager.name}
                      onChange={(e) => setNewLocation({
                        ...newLocation,
                        siteManager: { ...newLocation.siteManager, name: e.target.value }
                      })}
                      placeholder="Full name of site manager"
                    />
                  </div>
                  <div>
                    <Label htmlFor="manager-phone">Manager Phone *</Label>
                    <Input
                      id="manager-phone"
                      value={newLocation.siteManager.phoneNumber}
                      onChange={(e) => setNewLocation({
                        ...newLocation,
                        siteManager: { ...newLocation.siteManager, phoneNumber: e.target.value }
                      })}
                      placeholder="e.g., +970 59 123 4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="num-people">Number of People</Label>
                    <Input
                      id="num-people"
                      type="number"
                      value={newLocation.demographics.numberOfPeople}
                      onChange={(e) => setNewLocation({
                        ...newLocation,
                        demographics: { ...newLocation.demographics, numberOfPeople: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="Total people at site"
                    />
                  </div>
                  <div>
                    <Label htmlFor="num-children">Number of Children</Label>
                    <Input
                      id="num-children"
                      type="number"
                      value={newLocation.demographics.numberOfChildren}
                      onChange={(e) => setNewLocation({
                        ...newLocation,
                        demographics: { ...newLocation.demographics, numberOfChildren: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="Children at site"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>GPS Coordinates</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        step="any"
                        value={newLocation.gpsCoordinates.latitude}
                        onChange={(e) => setNewLocation({
                          ...newLocation,
                          gpsCoordinates: { ...newLocation.gpsCoordinates, latitude: parseFloat(e.target.value) || 0 }
                        })}
                        placeholder="Latitude"
                      />
                      <Input
                        type="number"
                        step="any"
                        value={newLocation.gpsCoordinates.longitude}
                        onChange={(e) => setNewLocation({
                          ...newLocation,
                          gpsCoordinates: { ...newLocation.gpsCoordinates, longitude: parseFloat(e.target.value) || 0 }
                        })}
                        placeholder="Longitude"
                      />
                      <Button type="button" variant="outline" onClick={getCurrentLocation}>
                        <Navigation className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button onClick={addLocation} disabled={loading}>
                    {loading ? 'Creating...' : 'Create Location'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Input
            placeholder="Search locations by name, governorate, neighborhood, type, or manager..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Governorate</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Demographics</TableHead>
                <TableHead>GPS</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.map((location) => (
                <TableRow key={location._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{location.name}</div>
                      <div className="text-sm text-muted-foreground">{location.neighborhood}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{location.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{location.governorate}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{location.siteManager.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {location.siteManager.phoneNumber}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {location.demographics.numberOfPeople}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Baby className="h-3 w-3 mr-1" />
                        {location.demographics.numberOfChildren}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div>{location.gpsCoordinates.latitude.toFixed(4)}</div>
                      <div>{location.gpsCoordinates.longitude.toFixed(4)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingLocation(location)
                          setShowEditDialog(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteLocation(location._id!, location.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLocations.length === 0 && !loading && (
            <div className="text-center py-10 text-muted-foreground">
              {searchQuery ? 'No locations found matching your search' : 'No locations created yet. Add your first location above!'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingLocation && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Location</DialogTitle>
              <DialogDescription>
                Update location information
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-location-name">Location Name *</Label>
                <Input
                  id="edit-location-name"
                  value={editingLocation.name}
                  onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-location-type">Location Type *</Label>
                <Select value={editingLocation.type} onValueChange={(value) => setEditingLocation({ ...editingLocation, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Collective_Centres_Non_UNRWA_Shelters">Collective Centres Non-UNRWA Shelters</SelectItem>
                    <SelectItem value="Collective_Centres_UNRWA_Shelters">Collective Centres UNRWA Shelters</SelectItem>
                    <SelectItem value="Makeshift_Shelters">Makeshift Shelters</SelectItem>
                    <SelectItem value="Scattered_Site">Scattered Site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-governorate">Governorate *</Label>
                <Select value={editingLocation.governorate} onValueChange={(value) => setEditingLocation({ ...editingLocation, governorate: value, neighborhood: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select governorate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="North Gaza">North Gaza</SelectItem>
                    <SelectItem value="Gaza">Gaza</SelectItem>
                    <SelectItem value="Deir al Balah">Deir al Balah</SelectItem>
                    <SelectItem value="Khan Yunis">Khan Yunis</SelectItem>
                    <SelectItem value="Rafah">Rafah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-neighborhood">Neighborhood *</Label>
                <Select
                  value={editingLocation.neighborhood}
                  onValueChange={(value) => setEditingLocation({ ...editingLocation, neighborhood: value })}
                  disabled={!editingLocation.governorate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={editingLocation.governorate ? "Select neighborhood" : "Select governorate first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getNeighborhoods(editingLocation.governorate).map((neighborhood) => (
                      <SelectItem key={neighborhood} value={neighborhood}>
                        {neighborhood}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-manager-name">Site Manager Name *</Label>
                <Input
                  id="edit-manager-name"
                  value={editingLocation.siteManager.name}
                  onChange={(e) => setEditingLocation({
                    ...editingLocation,
                    siteManager: { ...editingLocation.siteManager, name: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="edit-manager-phone">Manager Phone *</Label>
                <Input
                  id="edit-manager-phone"
                  value={editingLocation.siteManager.phoneNumber}
                  onChange={(e) => setEditingLocation({
                    ...editingLocation,
                    siteManager: { ...editingLocation.siteManager, phoneNumber: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="edit-num-people">Number of People</Label>
                <Input
                  id="edit-num-people"
                  type="number"
                  value={editingLocation.demographics.numberOfPeople}
                  onChange={(e) => setEditingLocation({
                    ...editingLocation,
                    demographics: { ...editingLocation.demographics, numberOfPeople: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="edit-num-children">Number of Children</Label>
                <Input
                  id="edit-num-children"
                  type="number"
                  value={editingLocation.demographics.numberOfChildren}
                  onChange={(e) => setEditingLocation({
                    ...editingLocation,
                    demographics: { ...editingLocation.demographics, numberOfChildren: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>GPS Coordinates</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    step="any"
                    value={editingLocation.gpsCoordinates.latitude}
                    onChange={(e) => setEditingLocation({
                      ...editingLocation,
                      gpsCoordinates: { ...editingLocation.gpsCoordinates, latitude: parseFloat(e.target.value) || 0 }
                    })}
                    placeholder="Latitude"
                  />
                  <Input
                    type="number"
                    step="any"
                    value={editingLocation.gpsCoordinates.longitude}
                    onChange={(e) => setEditingLocation({
                      ...editingLocation,
                      gpsCoordinates: { ...editingLocation.gpsCoordinates, longitude: parseFloat(e.target.value) || 0 }
                    })}
                    placeholder="Longitude"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            const { latitude, longitude } = position.coords
                            setEditingLocation({
                              ...editingLocation,
                              gpsCoordinates: { latitude, longitude }
                            })
                            toast.success('GPS coordinates updated!')
                          },
                          () => toast.error('Unable to get GPS location')
                        )
                      }
                    }}
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowEditDialog(false); setEditingLocation(null); }}>
                Cancel
              </Button>
              <Button onClick={updateLocation} disabled={loading}>
                {loading ? 'Updating...' : 'Update Location'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}