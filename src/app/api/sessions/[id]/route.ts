import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Session } from '@/types/product'
import { createAuthHandler, AuthSession } from '@/lib/auth-middleware'
import { ObjectId } from 'mongodb'

async function handleGetSession(request: NextRequest, session: AuthSession, context: { params: { id: string } }) {
  try {
    const db = await connectDB()
    const { id } = context.params

    const sessionDoc = await db.collection('sessions').findOne({ _id: new ObjectId(id) })
    if (!sessionDoc) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get program details and check permission
    const program = await db.collection('programs').findOne({
      _id: new ObjectId(sessionDoc.programId)
    })
    if (!program) {
      return NextResponse.json({ error: 'Associated program not found' }, { status: 404 })
    }

    // Check if user has permission to view this session
    if (session.user.role !== 'admin' && program.conductedBy !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Populate program and location information
    sessionDoc.programTitle = program.title
    sessionDoc.programCode = program.programCode

    if (sessionDoc.locationId) {
      const location = await db.collection('locations').findOne({
        _id: new ObjectId(sessionDoc.locationId)
      })
      if (location) {
        sessionDoc.locationName = location.name
        sessionDoc.locationNeighborhood = location.neighborhood
      }
    }

    return NextResponse.json(sessionDoc)
  } catch (error) {
    console.error('Fetch session error:', error)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}

async function handleUpdateSession(request: NextRequest, session: AuthSession, context: { params: { id: string } }) {
  try {
    const db = await connectDB()
    const { id } = context.params
    const sessionUpdates: Partial<Session> = await request.json()

    // Check if session exists
    const existingSession = await db.collection('sessions').findOne({ _id: new ObjectId(id) })
    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get program details and check permission
    const program = await db.collection('programs').findOne({
      _id: new ObjectId(existingSession.programId)
    })
    if (!program) {
      return NextResponse.json({ error: 'Associated program not found' }, { status: 404 })
    }

    // Check if user has permission to update this session
    if (session.user.role !== 'admin' && program.conductedBy !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Validate session times if provided
    if (sessionUpdates.date && sessionUpdates.startTime && sessionUpdates.endTime) {
      const sessionDate = new Date(`${sessionUpdates.date}T${sessionUpdates.startTime}`)
      const endTime = new Date(`${sessionUpdates.date}T${sessionUpdates.endTime}`)
      if (endTime <= sessionDate) {
        return NextResponse.json({
          error: 'End time must be after start time'
        }, { status: 400 })
      }
    }

    // Check if session date is within program duration if date is being updated
    if (sessionUpdates.date) {
      const programStart = new Date(program.startDate)
      const programEnd = new Date(program.endDate)
      const sessionOnly = new Date(sessionUpdates.date)

      if (sessionOnly < programStart || sessionOnly > programEnd) {
        return NextResponse.json({
          error: 'Session date must be within program duration'
        }, { status: 400 })
      }
    }

    // Don't allow updating certain protected fields
    const {
      _id,
      sessionCode,
      programId,
      sessionNumber,
      conductedBy,
      createdAt,
      actualParticipants,
      attendanceRate,
      materialsUsed,
      ...allowedUpdates
    } = sessionUpdates

    // Add updated timestamp
    const updatedSession = {
      ...allowedUpdates,
      updatedAt: new Date().toISOString(),
      // Ensure numeric fields are numbers if provided
      ...(allowedUpdates.expectedParticipants !== undefined && {
        expectedParticipants: Number(allowedUpdates.expectedParticipants)
      })
    }

    const result = await db.collection('sessions').updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedSession }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Return the updated session
    const updated = await db.collection('sessions').findOne({ _id: new ObjectId(id) })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update session error:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}

async function handleDeleteSession(request: NextRequest, session: AuthSession, context: { params: { id: string } }) {
  try {
    const db = await connectDB()
    const { id } = context.params

    // Check if session exists
    const existingSession = await db.collection('sessions').findOne({ _id: new ObjectId(id) })
    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get program details and check permission
    const program = await db.collection('programs').findOne({
      _id: new ObjectId(existingSession.programId)
    })
    if (!program) {
      return NextResponse.json({ error: 'Associated program not found' }, { status: 404 })
    }

    // Check if user has permission to delete this session
    if (session.user.role !== 'admin' && program.conductedBy !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if session has any attendance records
    const attendanceCount = await db.collection('session_attendance').countDocuments({ sessionId: id })

    if (attendanceCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete session that has attendance records. Please remove them first.'
      }, { status: 400 })
    }

    const result = await db.collection('sessions').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete session error:', error)
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}

export const GET = createAuthHandler(handleGetSession, 'any')
export const PUT = createAuthHandler(handleUpdateSession, 'any')
export const DELETE = createAuthHandler(handleDeleteSession, 'any')