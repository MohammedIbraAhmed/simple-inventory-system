import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { createAuthHandler, AuthSession } from '@/lib/auth-middleware'
import { ObjectId } from 'mongodb'

async function handleUpdateLocationRequest(
  request: NextRequest,
  session: AuthSession,
  params?: { id?: string }
) {
  try {
    // Only admins can approve/reject requests
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const db = await connectDB()
    const { action, adminNotes } = await request.json()

    // Debug logging
    console.log('Session user:', session.user)
    console.log('User ID:', session.user.id)
    console.log('User email:', session.user.email)
    console.log('Session object structure:', JSON.stringify(session, null, 2))
    console.log('Params object:', JSON.stringify(params, null, 2))

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const requestId = params?.id
    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }
    const locationRequest = await db.collection('locationRequests').findOne({
      _id: new ObjectId(requestId)
    })

    if (!locationRequest) {
      return NextResponse.json({ error: 'Location request not found' }, { status: 404 })
    }

    if (locationRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 })
    }

    // Get user identifier safely
    const userIdentifier = session.user?.id || session.user?.email || 'unknown'
    const userName = session.user?.name || session.user?.email || 'Unknown User'

    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      adminNotes: adminNotes || '',
      reviewedBy: userIdentifier,
      reviewedByName: userName,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // If approving, process the request
    if (action === 'approve') {
      const { requestType, locationData, originalLocationId } = locationRequest

      if (requestType === 'create') {
        // Create new location
        const newLocation = {
          ...locationData,
          region: 'Gaza Strip',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        }
        await db.collection('locations').insertOne(newLocation)
      } else if (requestType === 'edit' && originalLocationId) {
        // Update existing location
        await db.collection('locations').updateOne(
          { _id: new ObjectId(originalLocationId) },
          {
            $set: {
              ...locationData,
              updatedAt: new Date().toISOString()
            }
          }
        )
      } else if (requestType === 'delete' && originalLocationId) {
        // Soft delete location
        await db.collection('locations').updateOne(
          { _id: new ObjectId(originalLocationId) },
          {
            $set: {
              isActive: false,
              updatedAt: new Date().toISOString()
            }
          }
        )
      }
    }

    // Update the request status
    await db.collection('locationRequests').updateOne(
      { _id: new ObjectId(requestId) },
      { $set: updateData }
    )

    // Create notification for the requester
    try {
      const notificationMessage = action === 'approve'
        ? `Your location ${locationRequest.requestType} request for "${locationRequest.locationData.name}" has been approved!`
        : `Your location ${locationRequest.requestType} request for "${locationRequest.locationData.name}" has been rejected.`

      const notification = {
        userId: locationRequest.requestedBy,
        type: 'location_request',
        title: `Location Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: notificationMessage,
        priority: action === 'approve' ? 'high' : 'medium',
        isRead: false,
        createdAt: new Date().toISOString(),
        actionUrl: '/locations',
        metadata: {
          locationRequestId: requestId,
          requestType: locationRequest.requestType,
          adminAction: action,
          reviewedBy: userIdentifier,
          locationName: locationRequest.locationData.name
        }
      }

      await db.collection('notifications').insertOne(notification)
    } catch (notificationError) {
      console.error('Failed to create notification for requester:', notificationError)
      // Continue with success response even if notification fails
    }

    return NextResponse.json({
      message: `Request ${action}d successfully`,
      status: updateData.status
    })
  } catch (error) {
    console.error('Update location request error:', error)
    return NextResponse.json({ error: 'Failed to update location request' }, { status: 500 })
  }
}

async function handleDeleteLocationRequest(
  request: NextRequest,
  session: AuthSession,
  params?: { id?: string }
) {
  try {
    const db = await connectDB()
    const requestId = params?.id

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    // Users can only delete their own pending requests
    let query: any = { _id: new ObjectId(requestId) }

    if (session.user.role !== 'admin') {
      const userIdentifier = session.user?.id || session.user?.email
      query.requestedBy = userIdentifier
      query.status = 'pending' // Only allow deletion of pending requests
    }

    const result = await db.collection('locationRequests').deleteOne(query)

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Request not found or cannot be deleted' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Request deleted successfully' })
  } catch (error) {
    console.error('Delete location request error:', error)
    return NextResponse.json({ error: 'Failed to delete location request' }, { status: 500 })
  }
}

// Only admins can approve/reject, but users can delete their own pending requests
export const PUT = createAuthHandler(handleUpdateLocationRequest, 'any')
export const DELETE = createAuthHandler(handleDeleteLocationRequest, 'any')