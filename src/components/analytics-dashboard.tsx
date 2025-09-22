'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, Package, Users, Workshop, TrendingUp, TrendingDown, AlertTriangle, Download } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'

interface DashboardData {
  overview: {
    totalProducts: number
    totalUsers: number
    totalWorkshops: number
    lowStockCount: number
    totalInventoryValue: number
    activeUsers: number
    completedWorkshops: number
    avgWorkshopParticipation: number
  }
  charts: {
    productsByCategory: Array<{ name: string; value: number; percentage: number }>
    stockLevels: Array<{ range: string; count: number }>
    workshopTrends: Array<{ month: string; workshops: number; participants: number }>
    inventoryValue: Array<{ category: string; value: number }>
    userActivity: Array<{ date: string; activeUsers: number }>
    lowStockItems: Array<{ name: string; sku: string; stock: number; category: string }>
  }
  timeFilters: {
    period: '7d' | '30d' | '90d' | '1y'
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timePeriod, setTimePeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchDashboardData()
  }, [timePeriod])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/analytics/dashboard?period=${timePeriod}`)
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const exportDashboard = async (format: 'pdf' | 'excel') => {
    try {
      const response = await fetch(`/api/analytics/export?format=${format}&period=${timePeriod}`)
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `dashboard_report_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading dashboard: {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (!data) return null

  const MetricCard = ({ title, value, icon: Icon, trend, description, color = "blue" }: {
    title: string
    value: string | number
    icon: any
    trend?: { value: number; direction: 'up' | 'down' }
    description?: string
    color?: string
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <Icon className={`h-4 w-4 text-${color}-500`} />
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <div className={`flex items-center text-xs ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.direction === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header with Time Filter and Export */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive system analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => exportDashboard('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="workshops">Workshops</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Products"
              value={data.overview.totalProducts}
              icon={Package}
              color="blue"
              description="Active inventory items"
            />
            <MetricCard
              title="Total Users"
              value={data.overview.totalUsers}
              icon={Users}
              color="green"
              description={`${data.overview.activeUsers} active`}
            />
            <MetricCard
              title="Workshops"
              value={data.overview.totalWorkshops}
              icon={Workshop}
              color="purple"
              description={`${data.overview.completedWorkshops} completed`}
            />
            <MetricCard
              title="Low Stock Items"
              value={data.overview.lowStockCount}
              icon={AlertTriangle}
              color="red"
              description="Need attention"
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Products by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Products by Category</CardTitle>
                <CardDescription>Distribution of inventory items</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.charts.productsByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.charts.productsByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Stock Levels Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Stock Level Distribution</CardTitle>
                <CardDescription>Products grouped by stock ranges</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.charts.stockLevels}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Workshop Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Workshop Trends</CardTitle>
                <CardDescription>Monthly workshop and participation data</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.charts.workshopTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="workshops" fill="#10b981" />
                    <Line yAxisId="right" type="monotone" dataKey="participants" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Inventory Value */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Value by Category</CardTitle>
                <CardDescription>Total value of inventory items</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.charts.inventoryValue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Value']} />
                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Total Inventory Value"
              value={`$${data.overview.totalInventoryValue.toLocaleString()}`}
              icon={Package}
              color="green"
            />
            <MetricCard
              title="Low Stock Alerts"
              value={data.overview.lowStockCount}
              icon={AlertTriangle}
              color="red"
            />
            <MetricCard
              title="Categories"
              value={data.charts.productsByCategory.length}
              icon={Package}
              color="blue"
            />
          </div>

          {/* Low Stock Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>Items that need restocking attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.charts.lowStockItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No low stock items</p>
                ) : (
                  data.charts.lowStockItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.stock === 0 ? 'destructive' : 'secondary'}>
                          {item.stock} left
                        </Badge>
                        <Badge variant="outline">{item.category}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workshops" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Total Workshops"
              value={data.overview.totalWorkshops}
              icon={Workshop}
              color="purple"
            />
            <MetricCard
              title="Completed"
              value={data.overview.completedWorkshops}
              icon={Workshop}
              color="green"
            />
            <MetricCard
              title="Avg. Participation"
              value={`${data.overview.avgWorkshopParticipation}%`}
              icon={Users}
              color="blue"
            />
          </div>

          {/* Workshop Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Workshop Performance Over Time</CardTitle>
              <CardDescription>Number of workshops and total participants</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.charts.workshopTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="workshops" stroke="#8b5cf6" strokeWidth={2} name="Workshops" />
                  <Line yAxisId="right" type="monotone" dataKey="participants" stroke="#f59e0b" strokeWidth={2} name="Participants" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Total Users"
              value={data.overview.totalUsers}
              icon={Users}
              color="blue"
            />
            <MetricCard
              title="Active Users"
              value={data.overview.activeUsers}
              icon={Users}
              color="green"
            />
            <MetricCard
              title="Activity Rate"
              value={`${Math.round((data.overview.activeUsers / data.overview.totalUsers) * 100)}%`}
              icon={TrendingUp}
              color="purple"
            />
          </div>

          {/* User Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Activity Trends</CardTitle>
              <CardDescription>Daily active users over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={data.charts.userActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="activeUsers" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}