import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { LocationSchema, validateData } from '@/lib/validations'
import { createAuthHandler, AuthSession } from '@/lib/auth-middleware'

async function handleGetLocation(request: NextRequest, session: AuthSession, { params }: { params: { id: string } }) {
  try {
    const db = await connectDB()

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
    }

    const location = await db.collection('locations').findOne({
      _id: new ObjectId(params.id),
      isActive: true
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error('Get location error:', error)
    return NextResponse.json({ error: 'Failed to fetch location' }, { status: 500 })
  }
}

async function handleUpdateLocation(request: NextRequest, session: AuthSession, { params }: { params: { id: string } }) {
  try {
    const db = await connectDB()

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
    }

    const locationData = await request.json()

    // Validate the data
    const validation = validateData(LocationSchema, {
      ...locationData,
      updatedAt: new Date().toISOString()
    })

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.errors
      }, { status: 400 })
    }

    // Check if location exists
    const existingLocation = await db.collection('locations').findOne({
      _id: new ObjectId(params.id),
      isActive: true
    })

    if (!existingLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Check for duplicate name (excluding current location)
    if (validation.data!.name !== existingLocation.name) {
      const duplicateLocation = await db.collection('locations').findOne({
        name: validation.data!.name,
        isActive: true,
        _id: { $ne: new ObjectId(params.id) }
      })

      if (duplicateLocation) {
        return NextResponse.json({
          error: 'A location with this name already exists'
        }, { status: 409 })
      }
    }

    // Remove _id from update data
    const { _id, ...updateData } = validation.data!

    const result = await db.collection('locations').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Return updated location
    const updatedLocation = await db.collection('locations').findOne({
      _id: new ObjectId(params.id)
    })

    return NextResponse.json(updatedLocation)
  } catch (error) {
    console.error('Update location error:', error)
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
  }
}

async function handleDeleteLocation(request: NextRequest, session: AuthSession, { params }: { params: { id: string } }) {
  try {
    const db = await connectDB()

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 })
    }

    // Check if location exists
    const existingLocation = await db.collection('locations').findOne({
      _id: new ObjectId(params.id),
      isActive: true
    })

    if (!existingLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Check if location is being used by any workshops
    const workshopsUsingLocation = await db.collection('workshops').countDocuments({
      locationId: params.id
    })

    if (workshopsUsingLocation > 0) {
      return NextResponse.json({
        error: `Cannot delete location. It is being used by ${workshopsUsingLocation} workshop(s).`
      }, { status: 409 })
    }

    // Soft delete the location
    const result = await db.collection('locations').updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          isActive: false,
          updatedAt: new Date().toISOString()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Location deleted successfully' })
  } catch (error) {
    console.error('Delete location error:', error)
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 })
  }
}

// Only admins can manage individual locations
export const GET = createAuthHandler(handleGetLocation, 'any')
export const PUT = createAuthHandler(handleUpdateLocation, 'admin')
export const DELETE = createAuthHandler(handleDeleteLocation, 'admin')