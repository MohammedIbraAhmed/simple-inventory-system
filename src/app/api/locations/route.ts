import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Location } from '@/types/product'
import { LocationSchema, validateData } from '@/lib/validations'
import { createAuthHandler, AuthSession } from '@/lib/auth-middleware'

async function handleGetLocations(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const { searchParams } = new URL(request.url)

    // Build query
    let query: any = { isActive: true }

    // Search functionality
    const search = searchParams.get('search')
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { neighborhood: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { 'siteManager.name': { $regex: search, $options: 'i' } }
      ]
    }

    // Filter by type
    const type = searchParams.get('type')
    if (type) {
      query.type = type
    }

    // Filter by neighborhood
    const neighborhood = searchParams.get('neighborhood')
    if (neighborhood) {
      query.neighborhood = neighborhood
    }

    const locations = await db.collection('locations').find(query).sort({ name: 1 }).toArray()
    return NextResponse.json(locations)
  } catch (error) {
    console.error('Fetch locations error:', error)
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }
}

async function handleCreateLocation(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const locationData = await request.json()

    // Validate the data
    const validation = validateData(LocationSchema, {
      ...locationData,
      region: 'Gaza Strip',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    })

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.errors
      }, { status: 400 })
    }

    // Check for duplicate location names
    const existingLocation = await db.collection('locations').findOne({
      name: validation.data!.name,
      isActive: true
    })

    if (existingLocation) {
      return NextResponse.json({
        error: 'A location with this name already exists'
      }, { status: 409 })
    }

    // Remove _id from data before insertion
    const { _id, ...locationWithoutId } = validation.data!
    const result = await db.collection('locations').insertOne(locationWithoutId)

    return NextResponse.json({
      _id: result.insertedId,
      ...locationWithoutId
    }, { status: 201 })
  } catch (error) {
    console.error('Create location error:', error)
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 })
  }
}

// Any authenticated user can read and create locations, only admins can update/delete
export const GET = createAuthHandler(handleGetLocations, 'any')
export const POST = createAuthHandler(handleCreateLocation, 'any')