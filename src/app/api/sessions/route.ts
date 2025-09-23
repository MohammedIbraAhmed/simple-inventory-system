import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Session } from '@/types/product'
import { createAuthHandler, AuthSession } from '@/lib/auth-middleware'
import { generateSessionCode, getLocationDisplayName } from '@/lib/workshop-utils'
import { ObjectId } from 'mongodb'

async function handleGetSessions(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const url = new URL(request.url)
    const programId = url.searchParams.get('programId')

    let query = {}

    if (programId) {
      // Get sessions for a specific program
      query = { programId }

      // Check if user has permission to view this program
      const program = await db.collection('programs').findOne({ _id: new ObjectId(programId) })
      if (!program) {
        return NextResponse.json({ error: 'Program not found' }, { status: 404 })
      }

      if (session.user.role !== 'admin' && program.conductedBy !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    } else {
      // Get all sessions user has access to
      if (session.user.role !== 'admin') {
        // Get programs conducted by this user
        const userPrograms = await db.collection('programs').find({ conductedBy: session.user.id }).toArray()
        const programIds = userPrograms.map(p => p._id.toString())
        query = { programId: { $in: programIds } }
      }
    }

    const sessions = await db.collection('sessions').find(query).sort({ sessionNumber: 1 }).toArray()

    // Populate location and program information
    const sessionsWithDetails = await Promise.all(
      sessions.map(async (session) => {
        // Get program details
        if (session.programId) {
          const program = await db.collection('programs').findOne({
            _id: new ObjectId(session.programId)
          })
          if (program) {
            session.programTitle = program.title
            session.programCode = program.programCode
          }
        }

        // Get location details
        if (session.locationId) {
          const location = await db.collection('locations').findOne({
            _id: new ObjectId(session.locationId)
          })
          if (location) {
            session.locationName = location.name
            session.locationNeighborhood = location.neighborhood
          }
        }

        return session
      })
    )

    return NextResponse.json(sessionsWithDetails)
  } catch (error) {
    console.error('Fetch sessions error:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

async function handleCreateSession(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const sessionData: Session = await request.json()

    // Validate required fields
    if (!sessionData.programId || !sessionData.title || !sessionData.date || !sessionData.startTime || !sessionData.endTime) {
      return NextResponse.json({
        error: 'Program ID, title, date, start time, and end time are required'
      }, { status: 400 })
    }

    // Get program details and verify permission
    const program = await db.collection('programs').findOne({ _id: new ObjectId(sessionData.programId) })
    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Check if user has permission to create sessions for this program
    if (session.user.role !== 'admin' && program.conductedBy !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Validate session times
    const sessionDate = new Date(`${sessionData.date}T${sessionData.startTime}`)
    const endTime = new Date(`${sessionData.date}T${sessionData.endTime}`)
    if (endTime <= sessionDate) {
      return NextResponse.json({
        error: 'End time must be after start time'
      }, { status: 400 })
    }

    // Check if session date is within program duration
    const programStart = new Date(program.startDate)
    const programEnd = new Date(program.endDate)
    const sessionOnly = new Date(sessionData.date)

    if (sessionOnly < programStart || sessionOnly > programEnd) {
      return NextResponse.json({
        error: 'Session date must be within program duration'
      }, { status: 400 })
    }

    // Auto-assign session number if not provided
    let sessionNumber = sessionData.sessionNumber
    if (!sessionNumber) {
      const existingSessions = await db.collection('sessions')
        .find({ programId: sessionData.programId })
        .sort({ sessionNumber: -1 })
        .limit(1)
        .toArray()

      sessionNumber = existingSessions.length > 0 ? existingSessions[0].sessionNumber + 1 : 1
    }

    // Check if session number already exists for this program
    const existingSession = await db.collection('sessions')
      .findOne({ programId: sessionData.programId, sessionNumber })

    if (existingSession) {
      return NextResponse.json({
        error: `Session number ${sessionNumber} already exists for this program`
      }, { status: 400 })
    }

    // Check if we're not exceeding total sessions
    if (sessionNumber > program.totalSessions) {
      return NextResponse.json({
        error: `Cannot create session ${sessionNumber}. Program only has ${program.totalSessions} total sessions.`
      }, { status: 400 })
    }

    // Generate session code
    const sessionCode = generateSessionCode(program.programCode, sessionNumber)

    // Use program location if no specific location provided
    const locationId = sessionData.locationId || program.locationId

    // Set session properties
    const now = new Date().toISOString()
    const newSession = {
      ...sessionData,
      sessionCode,
      sessionNumber,
      locationId,
      conductedBy: session.user.id,
      status: 'planned' as const,
      actualParticipants: 0,
      attendanceRate: 0,
      createdAt: now,
      updatedAt: now,
      // Ensure numeric fields are numbers
      expectedParticipants: Number(sessionData.expectedParticipants) || program.expectedParticipants,
      // Initialize arrays
      objectives: Array.isArray(sessionData.objectives) ? sessionData.objectives : [],
      materialsUsed: []
    }

    const { _id, ...sessionWithoutId } = newSession
    const result = await db.collection('sessions').insertOne(sessionWithoutId)

    return NextResponse.json({ _id: result.insertedId, ...newSession })
  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}

// Authenticated users can access sessions (with role-based filtering)
export const GET = createAuthHandler(handleGetSessions, 'any')
export const POST = createAuthHandler(handleCreateSession, 'any')