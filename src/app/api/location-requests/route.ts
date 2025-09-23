import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { LocationRequest } from '@/types/product'
import { createAuthHandler, AuthSession } from '@/lib/auth-middleware'

async function handleGetLocationRequests(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const { searchParams } = new URL(request.url)

    let query: any = {}

    // If user is not admin, only show their own requests
    if (session.user.role !== 'admin') {
      const userIdentifier = session.user?.id || session.user?.email
      query.requestedBy = userIdentifier
    }

    // Filter by status if provided
    const status = searchParams.get('status')
    if (status) {
      query.status = status
    }

    const requests = await db.collection('locationRequests')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Fetch location requests error:', error)
    return NextResponse.json({ error: 'Failed to fetch location requests' }, { status: 500 })
  }
}

async function handleCreateLocationRequest(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const requestData = await request.json()

    // Validate required fields
    if (!requestData.requestType || !requestData.locationData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // For edit/delete requests, ensure originalLocationId is provided
    if ((requestData.requestType === 'edit' || requestData.requestType === 'delete') && !requestData.originalLocationId) {
      return NextResponse.json({ error: 'Original location ID required for edit/delete requests' }, { status: 400 })
    }

    const locationRequest: Omit<LocationRequest, '_id'> = {
      requestType: requestData.requestType,
      locationData: requestData.locationData,
      originalLocationId: requestData.originalLocationId,
      requestedBy: session.user?.id || session.user?.email,
      requestedByName: session.user.name || session.user.email,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await db.collection('locationRequests').insertOne(locationRequest)

    // Create notification for all admins
    try {
      const admins = await db.collection('users').find({ role: 'admin' }).toArray()

      const notifications = admins.map(admin => ({
        userId: admin._id.toString(),
        type: 'location_request',
        title: `New Location ${requestData.requestType.charAt(0).toUpperCase() + requestData.requestType.slice(1)} Request`,
        message: `${session.user.name || session.user.email} requested to ${requestData.requestType} location "${requestData.locationData.name}" in ${requestData.locationData.governorate}`,
        priority: 'medium',
        isRead: false,
        createdAt: new Date().toISOString(),
        actionUrl: '/admin',
        metadata: {
          locationRequestId: result.insertedId.toString(),
          requestType: requestData.requestType,
          requestedBy: session.user?.id || session.user?.email,
          locationName: requestData.locationData.name
        }
      }))

      if (notifications.length > 0) {
        await db.collection('notifications').insertMany(notifications)
      }
    } catch (notificationError) {
      console.error('Failed to create notifications:', notificationError)
      // Continue with success response even if notifications fail
    }

    return NextResponse.json({
      _id: result.insertedId,
      ...locationRequest
    }, { status: 201 })
  } catch (error) {
    console.error('Create location request error:', error)
    return NextResponse.json({ error: 'Failed to create location request' }, { status: 500 })
  }
}

// Any authenticated user can read their requests and create new ones
export const GET = createAuthHandler(handleGetLocationRequests, 'any')
export const POST = createAuthHandler(handleCreateLocationRequest, 'any')