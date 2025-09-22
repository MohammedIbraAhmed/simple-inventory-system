'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export interface SearchFilter {
  field: string
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between'
  value: string | number | [number, number]
  label: string
}

export interface SearchResult {
  id: string
  type: 'product' | 'workshop' | 'user' | 'distribution'
  title: string
  subtitle?: string
  data: any
  score: number
}

interface AdvancedSearchProps {
  onSearch: (query: string, filters: SearchFilter[]) => Promise<SearchResult[]>
  onResultSelect: (result: SearchResult) => void
  placeholder?: string
  searchFields?: { field: string; label: string; type: 'text' | 'number' | 'select'; options?: string[] }[]
}

export function AdvancedSearch({
  onSearch,
  onResultSelect,
  placeholder = "Search products, workshops, users...",
  searchFields = []
}: AdvancedSearchProps) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilter[]>([])
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string, searchFilters: SearchFilter[]) => {
      if (searchQuery.trim().length < 2 && searchFilters.length === 0) {
        setResults([])
        setShowResults(false)
        return
      }

      setIsLoading(true)
      try {
        const searchResults = await onSearch(searchQuery, searchFilters)
        setResults(searchResults)
        setShowResults(true)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300),
    [onSearch]
  )

  useEffect(() => {
    debouncedSearch(query, filters)
  }, [query, filters, debouncedSearch])

  const addFilter = (filter: SearchFilter) => {
    setFilters(prev => [...prev, filter])
  }

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllFilters = () => {
    setFilters([])
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'product': return '📦'
      case 'workshop': return '🎓'
      case 'user': return '👤'
      case 'distribution': return '🚚'
      default: return '📄'
    }
  }

  const getResultColor = (type: string) => {
    switch (type) {
      case 'product': return 'bg-blue-100 text-blue-800'
      case 'workshop': return 'bg-green-100 text-green-800'
      case 'user': return 'bg-purple-100 text-purple-800'
      case 'distribution': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-2 flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(true)}
            className="h-7 w-7 p-0"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          {(query || filters.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {filters.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {filters.map((filter, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {filter.label}: {Array.isArray(filter.value) ? filter.value.join(' - ') : filter.value}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter(index)}
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Results */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto shadow-lg">
          <CardContent className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No results found
              </div>
            ) : (
              <div className="space-y-1">
                {results.slice(0, 10).map((result) => (
                  <Button
                    key={result.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3"
                    onClick={() => {
                      onResultSelect(result)
                      setShowResults(false)
                    }}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <span className="text-lg">{getResultIcon(result.type)}</span>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{result.title}</span>
                          <Badge className={`text-xs ${getResultColor(result.type)}`}>
                            {result.type}
                          </Badge>
                        </div>
                        {result.subtitle && (
                          <div className="text-sm text-muted-foreground">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
                {results.length > 10 && (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    Showing 10 of {results.length} results
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Advanced Filters Dialog */}
      <FilterDialog
        open={showFilters}
        onOpenChange={setShowFilters}
        onAddFilter={addFilter}
        searchFields={searchFields}
      />
    </div>
  )
}

interface FilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddFilter: (filter: SearchFilter) => void
  searchFields: { field: string; label: string; type: 'text' | 'number' | 'select'; options?: string[] }[]
}

function FilterDialog({ open, onOpenChange, onAddFilter, searchFields }: FilterDialogProps) {
  const [selectedField, setSelectedField] = useState('')
  const [operator, setOperator] = useState<SearchFilter['operator']>('contains')
  const [value, setValue] = useState('')
  const [numberValue, setNumberValue] = useState<number>(0)
  const [rangeValue, setRangeValue] = useState<[number, number]>([0, 100])

  const selectedFieldConfig = searchFields.find(f => f.field === selectedField)

  const getOperatorOptions = (fieldType: string) => {
    switch (fieldType) {
      case 'number':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'greater', label: 'Greater than' },
          { value: 'less', label: 'Less than' },
          { value: 'between', label: 'Between' }
        ]
      case 'text':
      default:
        return [
          { value: 'contains', label: 'Contains' },
          { value: 'equals', label: 'Equals' }
        ]
    }
  }

  const handleAddFilter = () => {
    if (!selectedField || !selectedFieldConfig) return

    let filterValue: string | number | [number, number]

    if (selectedFieldConfig.type === 'number') {
      filterValue = operator === 'between' ? rangeValue : numberValue
    } else {
      filterValue = value
    }

    const filter: SearchFilter = {
      field: selectedField,
      operator,
      value: filterValue,
      label: selectedFieldConfig.label
    }

    onAddFilter(filter)
    onOpenChange(false)

    // Reset form
    setSelectedField('')
    setOperator('contains')
    setValue('')
    setNumberValue(0)
    setRangeValue([0, 100])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Filter</DialogTitle>
          <DialogDescription>
            Add advanced filters to refine your search results.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Field</Label>
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger>
                <SelectValue placeholder="Select field to filter" />
              </SelectTrigger>
              <SelectContent>
                {searchFields.map((field) => (
                  <SelectItem key={field.field} value={field.field}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFieldConfig && (
            <>
              <div>
                <Label>Operator</Label>
                <Select value={operator} onValueChange={(value) => setOperator(value as SearchFilter['operator'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getOperatorOptions(selectedFieldConfig.type).map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Value</Label>
                {selectedFieldConfig.type === 'select' ? (
                  <Select value={value} onValueChange={setValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedFieldConfig.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : selectedFieldConfig.type === 'number' ? (
                  operator === 'between' ? (
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        value={rangeValue[0]}
                        onChange={(e) => setRangeValue([Number(e.target.value), rangeValue[1]])}
                        placeholder="Min"
                      />
                      <span>to</span>
                      <Input
                        type="number"
                        value={rangeValue[1]}
                        onChange={(e) => setRangeValue([rangeValue[0], Number(e.target.value)])}
                        placeholder="Max"
                      />
                    </div>
                  ) : (
                    <Input
                      type="number"
                      value={numberValue}
                      onChange={(e) => setNumberValue(Number(e.target.value))}
                      placeholder="Enter number"
                    />
                  )
                ) : (
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter value"
                  />
                )}
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddFilter} disabled={!selectedField || (!value && selectedFieldConfig?.type !== 'number')}>
            Add Filter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(null, args), wait)
  }) as T
}