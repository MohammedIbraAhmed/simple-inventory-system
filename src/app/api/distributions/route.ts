import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Distribution } from '@/types/product'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    const db = await connectDB()
    const distributions = await db.collection('distributions').find({}).sort({ date: -1 }).toArray()
    return NextResponse.json(distributions)
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch distributions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await connectDB()
    const distribution: Distribution = await request.json()

    // Validate required fields
    if (!distribution.productId || !distribution.quantity || !distribution.recipient) {
      return NextResponse.json({ error: 'Product, quantity, and recipient are required' }, { status: 400 })
    }

    // Ensure numeric fields are numbers
    distribution.quantity = Number(distribution.quantity) || 0

    // Check if product exists and has enough stock
    const product = await db.collection('products').findOne({ _id: new ObjectId(distribution.productId) })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.stock < distribution.quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
    }

    // Add distribution
    const { _id, ...distributionWithoutId } = distribution
    const result = await db.collection('distributions').insertOne({
      ...distributionWithoutId,
      productName: product.name,
      date: new Date().toISOString().split('T')[0]
    })

    // Update product stock
    await db.collection('products').updateOne(
      { _id: new ObjectId(distribution.productId) },
      { $inc: { stock: -distribution.quantity } }
    )

    return NextResponse.json({ _id: result.insertedId, ...distribution })
  } catch (error) {
    console.error('Create error:', error)
    return NextResponse.json({ error: 'Failed to create distribution' }, { status: 500 })
  }
}