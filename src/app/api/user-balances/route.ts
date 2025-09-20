import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { createAuthHandler, AuthSession, checkResourceOwnership } from '@/lib/auth-middleware'

async function handleGetBalances(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    let query = {}
    if (userId) {
      // Check if user can access the requested userId's balances
      if (!await checkResourceOwnership(session, userId)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
      query = { userId }
    } else {
      // If no userId specified, show user's own balances (or all for admin)
      if (session.user.role === 'admin') {
        query = {} // Admin sees all balances
      } else {
        query = { userId: session.user.id } // Regular users see only their own
      }
    }

    const balances = await db.collection('userBalances').find(query).toArray()
    return NextResponse.json(balances)
  } catch (error) {
    console.error('Fetch balances error:', error)
    return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 })
  }
}

export const GET = createAuthHandler(handleGetBalances, 'any')

async function handleAllocateStock(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const { userId, productId, quantity, notes } = await request.json()

    // Validate required fields
    if (!userId || !productId || !quantity) {
      return NextResponse.json({ error: 'UserId, productId, and quantity are required' }, { status: 400 })
    }

    // Get product details
    const product = await db.collection('products').findOne({ _id: new ObjectId(productId) })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if admin has enough stock
    if (product.stock < quantity) {
      return NextResponse.json({ error: 'Insufficient stock in main inventory' }, { status: 400 })
    }

    // Check if user balance already exists for this product
    const existingBalance = await db.collection('userBalances').findOne({ userId, productId })

    if (existingBalance) {
      // Update existing balance
      await db.collection('userBalances').updateOne(
        { userId, productId },
        {
          $inc: {
            allocatedQuantity: quantity,
            availableQuantity: quantity
          },
          $set: { lastUpdated: new Date().toISOString() }
        }
      )
    } else {
      // Create new balance
      await db.collection('userBalances').insertOne({
        userId,
        productId,
        productName: product.name,
        allocatedQuantity: quantity,
        availableQuantity: quantity,
        lastUpdated: new Date().toISOString()
      })
    }

    // Reduce stock from main inventory
    await db.collection('products').updateOne(
      { _id: new ObjectId(productId) },
      { $inc: { stock: -quantity } }
    )

    // Record transaction
    await db.collection('stockTransactions').insertOne({
      fromUserId: session.user.id, // admin
      toUserId: userId,
      productId,
      productName: product.name,
      quantity,
      type: 'allocation',
      timestamp: new Date().toISOString(),
      notes: notes || ''
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Allocate stock error:', error)
    return NextResponse.json({ error: 'Failed to allocate stock' }, { status: 500 })
  }
}

export const POST = createAuthHandler(handleAllocateStock, 'admin')