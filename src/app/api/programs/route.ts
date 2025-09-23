import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Program } from '@/types/product'
import { createAuthHandler, AuthSession } from '@/lib/auth-middleware'
import { generateUniqueProgramCode, getLocationDisplayName } from '@/lib/workshop-utils'
import { ObjectId } from 'mongodb'

async function handleGetPrograms(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()

    let query = {}
    // Regular users can only see their own programs, admins see all
    if (session.user.role !== 'admin') {
      query = { conductedBy: session.user.id }
    }

    const programs = await db.collection('programs').find(query).toArray()

    // Populate location information
    const programsWithLocation = await Promise.all(
      programs.map(async (program) => {
        if (program.locationId) {
          const location = await db.collection('locations').findOne({
            _id: new ObjectId(program.locationId)
          })
          if (location) {
            program.locationName = location.name
            program.locationNeighborhood = location.neighborhood
          }
        }
        return program
      })
    )

    return NextResponse.json(programsWithLocation)
  } catch (error) {
    console.error('Fetch programs error:', error)
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
  }
}

async function handleCreateProgram(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const program: Program = await request.json()

    // Validate required fields
    if (!program.title || !program.startDate || !program.endDate || !program.locationId || !program.totalSessions) {
      return NextResponse.json({
        error: 'Title, start date, end date, location, and total sessions are required'
      }, { status: 400 })
    }

    // Validate dates
    const startDate = new Date(program.startDate)
    const endDate = new Date(program.endDate)
    if (endDate <= startDate) {
      return NextResponse.json({
        error: 'End date must be after start date'
      }, { status: 400 })
    }

    // Validate session counts
    if (program.totalSessions < 1) {
      return NextResponse.json({
        error: 'Total sessions must be at least 1'
      }, { status: 400 })
    }

    if (program.minimumSessionsForCompletion > program.totalSessions) {
      return NextResponse.json({
        error: 'Minimum sessions for completion cannot exceed total sessions'
      }, { status: 400 })
    }

    // Get location details for program code generation
    const location = await db.collection('locations').findOne({ _id: new ObjectId(program.locationId) })
    if (!location) {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 })
    }

    // Get user details for program code generation
    const user = await db.collection('users').findOne({ _id: new ObjectId(session.user.id) })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    // Get existing program codes for uniqueness check
    const existingPrograms = await db.collection('programs')
      .find({}, { projection: { programCode: 1 } })
      .toArray()
    const existingCodes = existingPrograms
      .map(p => p.programCode)
      .filter(code => code) // Remove null/undefined codes

    // Generate unique program code
    const locationName = getLocationDisplayName(location)
    const programCode = await generateUniqueProgramCode(
      user.name,
      program.startDate,
      locationName,
      existingCodes
    )

    // Set program properties
    const now = new Date().toISOString()
    const newProgram = {
      ...program,
      programCode,
      conductedBy: session.user.id,
      status: 'planned' as const,
      enrolledParticipants: 0,
      completedParticipants: 0,
      createdAt: now,
      updatedAt: now,
      // Ensure numeric fields are numbers
      expectedParticipants: Number(program.expectedParticipants) || 0,
      totalSessions: Number(program.totalSessions),
      minimumSessionsForCompletion: Number(program.minimumSessionsForCompletion) || Math.ceil(program.totalSessions * 0.8),
      targetAgeGroup: {
        minAge: Number(program.targetAgeGroup?.minAge) || 0,
        maxAge: Number(program.targetAgeGroup?.maxAge) || 100
      },
      objectives: Array.isArray(program.objectives) ? program.objectives : [],
      materials: Array.isArray(program.materials) ? program.materials : []
    }

    const { _id, ...programWithoutId } = newProgram
    const result = await db.collection('programs').insertOne(programWithoutId)

    return NextResponse.json({ _id: result.insertedId, ...newProgram })
  } catch (error) {
    console.error('Create program error:', error)
    return NextResponse.json({ error: 'Failed to create program' }, { status: 500 })
  }
}

// Authenticated users can access programs (with role-based filtering)
export const GET = createAuthHandler(handleGetPrograms, 'any')
export const POST = createAuthHandler(handleCreateProgram, 'any')