'use client'

import { useState, useRef } from 'react'
import { Upload, Download, FileSpreadsheet, Users, Package, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface BulkOperationResult {
  success: number
  failed: number
  errors: Array<{
    row: number
    error: string
    data?: any
  }>
}

interface BulkOperationsProps {
  userRole: string
}

export function BulkOperations({ userRole }: BulkOperationsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('products')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<BulkOperationResult | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sample CSV templates
  const templates = {
    products: {
      filename: 'products_template.csv',
      headers: ['name', 'sku', 'stock', 'price', 'category', 'notes'],
      sample: [
        ['Office Supplies Kit', 'OSK-001', '50', '25.99', 'materials', 'Basic office supplies'],
        ['Water Bottles', 'WB-001', '100', '5.99', 'refreshments', 'Reusable water bottles']
      ]
    },
    users: {
      filename: 'users_template.csv',
      headers: ['name', 'email', 'role', 'organization', 'phone', 'location'],
      sample: [
        ['John Doe', 'john@example.com', 'user', 'UNICEF', '+1234567890', 'New York'],
        ['Jane Smith', 'jane@example.com', 'user', 'Red Cross', '+0987654321', 'London']
      ]
    },
    workshops: {
      filename: 'workshops_template.csv',
      headers: ['title', 'description', 'date', 'startTime', 'endTime', 'location', 'expectedParticipants'],
      sample: [
        ['Basic First Aid', 'Introduction to first aid techniques', '2024-01-15', '10:00', '12:00', 'Community Center', '20'],
        ['Emergency Response', 'Emergency response procedures', '2024-01-20', '14:00', '16:00', 'Training Hall', '15']
      ]
    }
  }

  const downloadTemplate = (type: 'products' | 'users' | 'workshops') => {
    const template = templates[type]
    const csvContent = [
      template.headers.join(','),
      ...template.sample.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = template.filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportData = async (type: 'products' | 'users' | 'workshops', format: 'csv' | 'xlsx') => {
    setIsProcessing(true)
    setProgress(0)

    try {
      const endpoint = `/api/${type}/export`
      const response = await fetch(endpoint)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const data = await response.json()
      setProgress(50)

      let content: string | ArrayBuffer
      let mimeType: string
      let filename: string

      if (format === 'csv') {
        content = Papa.unparse(data.data)
        mimeType = 'text/csv'
        filename = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`
      } else {
        const ws = XLSX.utils.json_to_sheet(data.data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, type)
        content = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        filename = `${type}_export_${new Date().toISOString().split('T')[0]}.xlsx`
      }

      setProgress(100)

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)

      toast.success(`${type} exported successfully`)

    } catch (error) {
      console.error('Export error:', error)
      toast.error('Export failed')
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setPreviewData(results.data.slice(0, 5)) // Show first 5 rows
          setShowPreview(true)
        },
        error: (error) => {
          toast.error('Error parsing CSV file')
          console.error(error)
        }
      })
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          setPreviewData(jsonData.slice(0, 5))
          setShowPreview(true)
        } catch (error) {
          toast.error('Error parsing Excel file')
          console.error(error)
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      toast.error('Please upload a CSV or Excel file')
    }
  }

  const processImport = async () => {
    if (!fileInputRef.current?.files?.[0]) return

    setIsProcessing(true)
    setProgress(0)
    setShowPreview(false)

    const file = fileInputRef.current.files[0]
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', activeTab)

    try {
      const response = await fetch(`/api/${activeTab}/import`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Import failed')
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const result = await response.json()
      clearInterval(progressInterval)
      setProgress(100)

      setResults(result)

      if (result.success > 0) {
        toast.success(`Import completed: ${result.success} records imported`)
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} records failed to import`)
      }

    } catch (error) {
      console.error('Import error:', error)
      toast.error('Import failed')
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Bulk Operations
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Operations</DialogTitle>
          <DialogDescription>
            Import and export data in bulk using CSV or Excel files
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            {userRole === 'admin' && (
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
            )}
            <TabsTrigger value="workshops" className="gap-2">
              📚 Workshops
            </TabsTrigger>
          </TabsList>

          {['products', 'users', 'workshops'].map((tabType) => (
            <TabsContent key={tabType} value={tabType} className="space-y-4">
              {(tabType !== 'users' || userRole === 'admin') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Import Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Import {tabType}
                      </CardTitle>
                      <CardDescription>
                        Upload CSV or Excel files to import {tabType} in bulk
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          className="w-full"
                          disabled={isProcessing}
                        >
                          Choose File
                        </Button>
                      </div>

                      <Button
                        onClick={() => downloadTemplate(tabType as any)}
                        variant="ghost"
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>

                      {showPreview && previewData.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Preview (first 5 rows)</h4>
                          <div className="border rounded-md max-h-48 overflow-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {Object.keys(previewData[0] || {}).map((key) => (
                                    <TableHead key={key} className="text-xs">
                                      {key}
                                    </TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {previewData.map((row, index) => (
                                  <TableRow key={index}>
                                    {Object.values(row).map((value: any, cellIndex) => (
                                      <TableCell key={cellIndex} className="text-xs">
                                        {String(value)}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          <Button
                            onClick={processImport}
                            className="w-full mt-2"
                            disabled={isProcessing}
                          >
                            Import Data
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Export Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Export {tabType}
                      </CardTitle>
                      <CardDescription>
                        Download all {tabType} data in CSV or Excel format
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => exportData(tabType as any, 'csv')}
                          variant="outline"
                          disabled={isProcessing}
                        >
                          Export CSV
                        </Button>
                        <Button
                          onClick={() => exportData(tabType as any, 'xlsx')}
                          variant="outline"
                          disabled={isProcessing}
                        >
                          Export Excel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Progress Indicator */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Results Display */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.failed > 0 ? (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                Import Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Success: {results.success}
                </Badge>
                {results.failed > 0 && (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    Failed: {results.failed}
                  </Badge>
                )}
              </div>

              {results.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Errors:</h4>
                  <div className="max-h-48 overflow-auto space-y-2">
                    {results.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertDescription>
                          Row {error.row}: {error.error}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}