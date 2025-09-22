import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { authConfig } from '@/lib/auth-config'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    // Calculate date range based on period
    const now = new Date()
    const startDate = new Date()

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    const db = await connectDB()

    // Parallel data fetching for better performance
    const [
      products,
      users,
      workshops,
      recentWorkshops,
      recentUserActivity
    ] = await Promise.all([
      db.collection('products').find({}).toArray(),
      db.collection('users').find({}).toArray(),
      db.collection('workshops').find({}).toArray(),
      db.collection('workshops').find({
        createdAt: { $gte: startDate.toISOString() }
      }).toArray(),
      db.collection('users').find({
        lastLogin: { $gte: startDate.toISOString() }
      }).toArray()
    ])

    // Calculate overview metrics
    const overview = {
      totalProducts: products.length,
      totalUsers: users.length,
      totalWorkshops: workshops.length,
      lowStockCount: products.filter(p => p.stock <= 10).length,
      totalInventoryValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
      activeUsers: recentUserActivity.length,
      completedWorkshops: workshops.filter(w => w.status === 'completed').length,
      avgWorkshopParticipation: workshops.length > 0
        ? Math.round((workshops.reduce((sum, w) => sum + (w.actualParticipants || 0), 0) / workshops.length))
        : 0
    }

    // Products by category
    const categoryGroups = products.reduce((acc, product) => {
      const category = product.category || 'unknown'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const productsByCategory = Object.entries(categoryGroups).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      percentage: Math.round((value / products.length) * 100)
    }))

    // Stock levels distribution
    const stockRanges = [
      { range: '0', min: 0, max: 0 },
      { range: '1-10', min: 1, max: 10 },
      { range: '11-50', min: 11, max: 50 },
      { range: '51-100', min: 51, max: 100 },
      { range: '100+', min: 101, max: Infinity }
    ]

    const stockLevels = stockRanges.map(range => ({
      range: range.range,
      count: products.filter(p => p.stock >= range.min && p.stock <= range.max).length
    }))

    // Workshop trends (monthly data)
    const workshopsByMonth = workshops.reduce((acc, workshop) => {
      const month = new Date(workshop.createdAt).toISOString().slice(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = { workshops: 0, participants: 0 }
      }
      acc[month].workshops++
      acc[month].participants += workshop.actualParticipants || 0
      return acc
    }, {} as Record<string, { workshops: number; participants: number }>)

    const workshopTrends = Object.entries(workshopsByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // Last 12 months
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        workshops: data.workshops,
        participants: data.participants
      }))

    // Inventory value by category
    const inventoryValue = Object.entries(categoryGroups).map(([category, count]) => {
      const categoryProducts = products.filter(p => p.category === category)
      const value = categoryProducts.reduce((sum, p) => sum + (p.price * p.stock), 0)
      return {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        value: Math.round(value)
      }
    })

    // User activity (last 30 days)
    const userActivity = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const activeCount = recentUserActivity.filter(user => {
        const loginDate = user.lastLogin ? new Date(user.lastLogin).toISOString().split('T')[0] : null
        return loginDate === dateStr
      }).length

      userActivity.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        activeUsers: activeCount
      })
    }

    // Low stock items
    const lowStockItems = products
      .filter(p => p.stock <= 10)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10)
      .map(p => ({
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        category: p.category
      }))

    const dashboardData = {
      overview,
      charts: {
        productsByCategory,
        stockLevels,
        workshopTrends,
        inventoryValue,
        userActivity,
        lowStockItems
      },
      timeFilters: {
        period
      },
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Dashboard analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}