import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { createAuthHandler, AuthSession } from '@/lib/auth-middleware'

async function handleUpdateProduct(request: NextRequest, session: AuthSession, params: { id: string }) {
  try {
    const db = await connectDB()
    const product = await request.json()

    // Remove _id from update data to avoid conflicts
    const { _id, ...updateData } = product

    // Validate required fields
    if (!updateData.name || !updateData.sku) {
      return NextResponse.json({ error: 'Name and SKU are required' }, { status: 400 })
    }

    // Ensure numeric fields are numbers
    updateData.stock = Number(updateData.stock) || 0
    updateData.price = Number(updateData.price) || 0

    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

async function handleDeleteProduct(request: NextRequest, session: AuthSession, params: { id: string }) {
  try {
    const db = await connectDB()
    const result = await db.collection('products').deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}

// Admin-only access for main stock management
export const PUT = createAuthHandler(handleUpdateProduct, 'admin')
export const DELETE = createAuthHandler(handleDeleteProduct, 'admin')