import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Product } from '@/types/product'
import { createAuthHandler, AuthSession } from '@/lib/auth-middleware'
import { validateData, ProductSchema } from '@/lib/validations'
import { withCache, cacheKeys, invalidateCache } from '@/lib/cache'

async function handleGetProducts(request: NextRequest, session: AuthSession) {
  try {
    const url = new URL(request.url)

    // Pagination parameters
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')))
    const skip = (page - 1) * limit

    // Search and filter parameters
    const search = url.searchParams.get('search') || ''
    const category = url.searchParams.get('category') || ''
    const lowStock = url.searchParams.get('lowStock') === 'true'

    // Generate cache key for this specific query
    const cacheKey = cacheKeys.products.list(page, limit, search, category)

    // Add lowStock to cache key if needed
    const fullCacheKey = lowStock ? `${cacheKey}:lowStock` : cacheKey

    // Try to get cached response
    const cachedResponse = await withCache(
      fullCacheKey,
      async () => {
        const db = await connectDB()

        // Build query
        let query: any = {}

        if (search) {
          query.$text = { $search: search }
        }

        if (category && category !== 'all') {
          query.category = category
        }

        if (lowStock) {
          query.stock = { $lt: 10 }
        }

        // Get total count for pagination (cached separately for efficiency)
        const countCacheKey = cacheKeys.products.count(search, category)
        const totalCount = await withCache(
          lowStock ? `${countCacheKey}:lowStock` : countCacheKey,
          async () => {
            return await db.collection('products').countDocuments(query)
          },
          300 // 5 minute cache for counts
        )

        // Get paginated products with optimized query
        const products = await db.collection('products')
          .find(query)
          .sort({ createdAt: -1 }) // Most recent first - this will use the new index
          .skip(skip)
          .limit(limit)
          .toArray()

        // Response with pagination metadata
        return {
          data: products,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            hasNext: page < Math.ceil(totalCount / limit),
            hasPrev: page > 1
          }
        }
      },
      300 // 5 minute cache for product lists
    )

    return NextResponse.json(cachedResponse)
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

    // Invalidate product cache since we added a new product
    invalidateCache.products()

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

// All authenticated users can view products, only admins can create
export const GET = createAuthHandler(handleGetProducts, 'any')
export const POST = createAuthHandler(handleCreateProduct, 'admin')