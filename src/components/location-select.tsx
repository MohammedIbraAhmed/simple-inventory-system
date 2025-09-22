'use client'

import { useState, useEffect } from 'react'
import { Location } from '@/types/product'
import { getNeighborhoods } from '@/lib/neighborhoods'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, MapPin } from 'lucide-react'

interface LocationSelectProps {
  value?: string
  onValueChange: (locationId: string, locationData?: { name: string; neighborhood: string }) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function LocationSelect({
  value,
  onValueChange,
  placeholder = "Select a location...",
  disabled = false,
  className
}: LocationSelectProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    fetchLocations()
  }, [])

  useEffect(() => {
    // Filter locations based on search query
    if (searchQuery.trim() === '') {
      setFilteredLocations(locations)
    } else {
      const filtered = locations.filter(location => {
        const query = searchQuery.toLowerCase()
        return (
          location.name.toLowerCase().includes(query) ||
          location.governorate.toLowerCase().includes(query) ||
          location.neighborhood.toLowerCase().includes(query) ||
          location.type.toLowerCase().includes(query) ||
          location.siteManager.name.toLowerCase().includes(query)
        )
      })
      setFilteredLocations(filtered)
    }
  }, [searchQuery, locations])

  const fetchLocations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/locations')
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
        setFilteredLocations(data)
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedLocation = locations.find(loc => loc._id === value)

  const handleLocationSelect = (locationId: string) => {
    const location = locations.find(loc => loc._id === locationId)
    if (location) {
      onValueChange(locationId, {
        name: location.name,
        neighborhood: location.neighborhood
      })
    }
    setShowDropdown(false)
    setSearchQuery('')
  }

  const formatLocationDisplay = (location: Location) => {
    return `${location.name} (${location.neighborhood})`
  }

  const formatLocationDetails = (location: Location) => {
    return `${location.governorate} • ${location.type} • ${location.demographics.numberOfPeople} people • Manager: ${location.siteManager.name}`
  }

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <Input placeholder="Loading locations..." disabled />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={selectedLocation ? formatLocationDisplay(selectedLocation) : placeholder}
          value={showDropdown ? searchQuery : (selectedLocation ? formatLocationDisplay(selectedLocation) : '')}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            if (!showDropdown) {
              setShowDropdown(true)
            }
          }}
          onFocus={() => setShowDropdown(true)}
          className="pl-10"
          disabled={disabled}
        />
        {selectedLocation && !showDropdown && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-6 w-6 p-0"
            onClick={() => {
              onValueChange('', undefined)
            }}
          >
            ×
          </Button>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && !disabled && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setShowDropdown(false)
              setSearchQuery('')
            }}
          />

          {/* Dropdown Content */}
          <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-hidden shadow-lg">
            <CardContent className="p-0">
              {filteredLocations.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  {searchQuery ? 'No locations found matching your search' : 'No locations available'}
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {filteredLocations.map((location) => (
                    <Button
                      key={location._id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 text-left border-b last:border-b-0"
                      onClick={() => handleLocationSelect(location._id!)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 space-y-1">
                          <div className="font-medium">
                            {formatLocationDisplay(location)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatLocationDetails(location)}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}