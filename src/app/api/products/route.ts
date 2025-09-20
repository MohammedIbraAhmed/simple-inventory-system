import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Product } from '@/types/product'
import { createAuthHandler, AuthSession } from '@/lib/auth-middleware'
import { validateData, ProductSchema } from '@/lib/validations'

async function handleGetProducts(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const products = await db.collection('products').find({}).toArray()
    return NextResponse.json(products)
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

async function handleCreateProduct(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const productData = await request.json()

    // Validate input data
    const validation = validateData(ProductSchema, productData)
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.errors
      }, { status: 400 })
    }

    const product = validation.data!

    // Check if SKU already exists
    const existingProduct = await db.collection('products').findOne({ sku: product.sku })
    if (existingProduct) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 })
    }

    // Add metadata
    const { _id, ...productWithoutId } = product
    const productWithMetadata = {
      ...productWithoutId,
      createdAt: new Date().toISOString(),
      createdBy: session.user.id,
      updatedAt: new Date().toISOString()
    }

    const result = await db.collection('products').insertOne(productWithMetadata)

    // Log the action for audit trail
    await db.collection('audit_logs').insertOne({
      action: 'CREATE_PRODUCT',
      userId: session.user.id,
      userEmail: session.user.email,
      resourceId: result.insertedId.toString(),
      resourceType: 'product',
      details: { sku: product.sku, name: product.name },
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({ _id: result.insertedId, ...productWithMetadata })
  } catch (error) {
    console.error('Create error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

// Admin-only access for main stock management
export const GET = createAuthHandler(handleGetProducts, 'admin')
export const POST = createAuthHandler(handleCreateProduct, 'admin')