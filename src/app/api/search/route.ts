import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { authConfig } from '@/lib/auth-config'
import { SearchFilter, SearchResult } from '@/components/advanced-search'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const filtersParam = searchParams.get('filters')
    const limit = parseInt(searchParams.get('limit') || '50')

    let filters: SearchFilter[] = []
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam)
      } catch (error) {
        console.error('Error parsing filters:', error)
      }
    }

    const db = await connectDB()
    const results: SearchResult[] = []

    // Build search aggregation pipeline
    const searchStages = []

    // Add text search if query exists
    if (query.trim()) {
      searchStages.push({
        $match: {
          $text: { $search: query }
        }
      })
      searchStages.push({
        $addFields: {
          score: { $meta: 'textScore' }
        }
      })
    }

    // Add filter conditions
    const filterConditions = buildFilterConditions(filters)
    if (Object.keys(filterConditions).length > 0) {
      searchStages.push({
        $match: filterConditions
      })
    }

    // Search Products
    try {
      const productPipeline = [
        ...searchStages,
        {
          $project: {
            _id: 1,
            name: 1,
            sku: 1,
            stock: 1,
            price: 1,
            category: 1,
            score: query.trim() ? { $meta: 'textScore' } : 1
          }
        },
        { $limit: Math.ceil(limit / 3) }
      ]

      const products = await db.collection('products').aggregate(productPipeline).toArray()

      for (const product of products) {
        results.push({
          id: product._id.toString(),
          type: 'product',
          title: product.name,
          subtitle: `SKU: ${product.sku} | Stock: ${product.stock} | $${product.price}`,
          data: product,
          score: product.score || 1
        })
      }
    } catch (error) {
      console.log('Product search error (might be due to missing text index):', error)
      // Fallback to regex search if text index doesn't exist
      if (query.trim()) {
        const products = await db.collection('products').find({
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { sku: { $regex: query, $options: 'i' } }
          ],
          ...filterConditions
        }).limit(Math.ceil(limit / 3)).toArray()

        for (const product of products) {
          results.push({
            id: product._id.toString(),
            type: 'product',
            title: product.name,
            subtitle: `SKU: ${product.sku} | Stock: ${product.stock} | $${product.price}`,
            data: product,
            score: 1
          })
        }
      }
    }

    // Search Workshops
    try {
      const workshopPipeline = [
        ...searchStages,
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            date: 1,
            location: 1,
            status: 1,
            expectedParticipants: 1,
            score: query.trim() ? { $meta: 'textScore' } : 1
          }
        },
        { $limit: Math.ceil(limit / 3) }
      ]

      const workshops = await db.collection('workshops').aggregate(workshopPipeline).toArray()

      for (const workshop of workshops) {
        results.push({
          id: workshop._id.toString(),
          type: 'workshop',
          title: workshop.title,
          subtitle: `${workshop.date} | ${workshop.location} | ${workshop.status}`,
          data: workshop,
          score: workshop.score || 1
        })
      }
    } catch (error) {
      console.log('Workshop search error (might be due to missing text index):', error)
      // Fallback to regex search
      if (query.trim()) {
        const workshops = await db.collection('workshops').find({
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { location: { $regex: query, $options: 'i' } }
          ],
          ...filterConditions
        }).limit(Math.ceil(limit / 3)).toArray()

        for (const workshop of workshops) {
          results.push({
            id: workshop._id.toString(),
            type: 'workshop',
            title: workshop.title,
            subtitle: `${workshop.date} | ${workshop.location} | ${workshop.status}`,
            data: workshop,
            score: 1
          })
        }
      }
    }

    // Search Users (admin only)
    if (session.user.role === 'admin') {
      try {
        const userPipeline = [
          ...searchStages,
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              role: 1,
              isActive: 1,
              'profile.organization': 1,
              score: query.trim() ? { $meta: 'textScore' } : 1
            }
          },
          { $limit: Math.ceil(limit / 3) }
        ]

        const users = await db.collection('users').aggregate(userPipeline).toArray()

        for (const user of users) {
          results.push({
            id: user._id.toString(),
            type: 'user',
            title: user.name,
            subtitle: `${user.email} | ${user.role} | ${user.profile?.organization || 'No org'}`,
            data: user,
            score: user.score || 1
          })
        }
      } catch (error) {
        console.log('User search error (might be due to missing text index):', error)
        // Fallback to regex search
        if (query.trim()) {
          const users = await db.collection('users').find({
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { email: { $regex: query, $options: 'i' } },
              { 'profile.organization': { $regex: query, $options: 'i' } }
            ],
            ...filterConditions
          }).limit(Math.ceil(limit / 3)).toArray()

          for (const user of users) {
            results.push({
              id: user._id.toString(),
              type: 'user',
              title: user.name,
              subtitle: `${user.email} | ${user.role} | ${user.profile?.organization || 'No org'}`,
              data: user,
              score: 1
            })
          }
        }
      }
    }

    // Sort by score and limit results
    results.sort((a, b) => (b.score || 0) - (a.score || 0))
    const limitedResults = results.slice(0, limit)

    return NextResponse.json({ results: limitedResults })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}

function buildFilterConditions(filters: SearchFilter[]): Record<string, any> {
  const conditions: Record<string, any> = {}

  for (const filter of filters) {
    switch (filter.operator) {
      case 'equals':
        conditions[filter.field] = filter.value
        break
      case 'contains':
        conditions[filter.field] = { $regex: filter.value, $options: 'i' }
        break
      case 'greater':
        conditions[filter.field] = { $gt: filter.value }
        break
      case 'less':
        conditions[filter.field] = { $lt: filter.value }
        break
      case 'between':
        if (Array.isArray(filter.value) && filter.value.length === 2) {
          conditions[filter.field] = { $gte: filter.value[0], $lte: filter.value[1] }
        }
        break
    }
  }

  return conditions
}

// Initialize search indexes
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()

    // Create text indexes for better search performance
    try {
      await db.collection('products').createIndex({
        name: 'text',
        sku: 'text',
        category: 'text'
      })

      await db.collection('workshops').createIndex({
        title: 'text',
        description: 'text',
        location: 'text'
      })

      await db.collection('users').createIndex({
        name: 'text',
        email: 'text',
        'profile.organization': 'text'
      })

      return NextResponse.json({
        message: 'Search indexes created successfully',
        timestamp: new Date().toISOString()
      })
    } catch (indexError) {
      console.log('Index creation info:', indexError)
      return NextResponse.json({
        message: 'Indexes may already exist or creation skipped',
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Index creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create search indexes' },
      { status: 500 }
    )
  }
}