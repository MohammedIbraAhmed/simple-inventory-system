import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { authOptions } from '@/lib/auth-config'
import { emailService } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()

    // Get all notification preferences to find users who want low stock alerts
    const preferences = await db.collection('notificationPreferences').find({
      $or: [
        { 'emailNotifications.lowStock': true },
        { 'pushNotifications.lowStock': true }
      ]
    }).toArray()

    // Get all products
    const products = await db.collection('products').find({}).toArray()

    const alertsSent = []

    for (const pref of preferences) {
      const user = await db.collection('users').findOne({ _id: pref.userId })
      if (!user || !user.isActive) continue

      const lowStockProducts = products.filter(product =>
        product.stock <= (pref.lowStockThreshold || 10)
      )

      if (lowStockProducts.length === 0) continue

      // Check if we've already sent an alert for these products recently (within 24 hours)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const recentAlerts = await db.collection('notifications').find({
        userId: pref.userId,
        type: 'low_stock',
        createdAt: { $gte: yesterday.toISOString() }
      }).toArray()

      const recentProductIds = recentAlerts.map(alert =>
        alert.metadata?.productId
      ).filter(Boolean)

      // Filter out products that already have recent alerts
      const newLowStockProducts = lowStockProducts.filter(product =>
        !recentProductIds.includes(product._id.toString())
      )

      if (newLowStockProducts.length === 0) continue

      // Create notifications for each low stock product
      for (const product of newLowStockProducts) {
        if (pref.pushNotifications.lowStock) {
          await db.collection('notifications').insertOne({
            userId: pref.userId,
            type: 'low_stock',
            title: 'Low Stock Alert',
            message: `${product.name} (SKU: ${product.sku}) is running low with only ${product.stock} items remaining.`,
            priority: product.stock === 0 ? 'urgent' : 'high',
            isRead: false,
            createdAt: new Date().toISOString(),
            actionUrl: '/admin',
            metadata: {
              productId: product._id.toString(),
              currentStock: product.stock,
              threshold: pref.lowStockThreshold
            }
          })
        }

        // Send email notification if enabled
        if (pref.emailNotifications.lowStock && user.email) {
          try {
            await emailService.sendLowStockAlert(
              user.email,
              user.name,
              product,
              pref.lowStockThreshold
            )
          } catch (emailError) {
            console.error('Error sending low stock email:', emailError)
          }
        }

        alertsSent.push({
          userId: pref.userId,
          userEmail: user.email,
          productName: product.name,
          productSku: product.sku,
          currentStock: product.stock
        })
      }
    }

    return NextResponse.json({
      message: `Low stock check completed. ${alertsSent.length} alerts sent.`,
      alertsSent
    })

  } catch (error) {
    console.error('Error checking low stock:', error)
    return NextResponse.json(
      { error: 'Failed to check low stock' },
      { status: 500 }
    )
  }
}

// GET endpoint to manually trigger low stock check (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()

    // Get products that are low in stock (using default threshold of 10)
    const lowStockProducts = await db.collection('products').find({
      stock: { $lte: 10 }
    }).toArray()

    const criticalStockProducts = lowStockProducts.filter(p => p.stock === 0)
    const lowStockCount = lowStockProducts.filter(p => p.stock > 0 && p.stock <= 10).length

    return NextResponse.json({
      lowStockCount,
      criticalStockCount: criticalStockProducts.length,
      totalProducts: await db.collection('products').countDocuments(),
      lowStockProducts: lowStockProducts.map(p => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        category: p.category
      }))
    })

  } catch (error) {
    console.error('Error getting low stock status:', error)
    return NextResponse.json(
      { error: 'Failed to get low stock status' },
      { status: 500 }
    )
  }
}