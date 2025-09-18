import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Product } from '@/types/product'

export async function GET() {
  try {
    const db = await connectDB()
    const products = await db.collection('products').find({}).toArray()
    return NextResponse.json(products)
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await connectDB()
    const product: Product = await request.json()

    // Validate required fields
    if (!product.name || !product.sku) {
      return NextResponse.json({ error: 'Name and SKU are required' }, { status: 400 })
    }

    // Ensure numeric fields are numbers
    product.stock = Number(product.stock) || 0
    product.price = Number(product.price) || 0

    // Check if SKU already exists
    const existingProduct = await db.collection('products').findOne({ sku: product.sku })
    if (existingProduct) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 })
    }

    const result = await db.collection('products').insertOne(product)
    return NextResponse.json({ _id: result.insertedId, ...product })
  } catch (error) {
    console.error('Create error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}