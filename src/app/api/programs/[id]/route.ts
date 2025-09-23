import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Program } from '@/types/product'
import { createAuthHandler, AuthSession, checkResourceOwnership } from '@/lib/auth-middleware'
import { ObjectId } from 'mongodb'

async function handleGetProgram(request: NextRequest, session: AuthSession, context: { params: { id: string } }) {
  try {
    const db = await connectDB()
    const { id } = context.params

    const program = await db.collection('programs').findOne({ _id: new ObjectId(id) })
    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Check if user has permission to view this program
    if (session.user.role !== 'admin' && program.conductedBy !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Populate location information
    if (program.locationId) {
      const location = await db.collection('locations').findOne({
        _id: new ObjectId(program.locationId)
      })
      if (location) {
        program.locationName = location.name
        program.locationNeighborhood = location.neighborhood
      }
    }

    return NextResponse.json(program)
  } catch (error) {
    console.error('Fetch program error:', error)
    return NextResponse.json({ error: 'Failed to fetch program' }, { status: 500 })
  }
}

async function handleUpdateProgram(request: NextRequest, session: AuthSession, context: { params: { id: string } }) {
  try {
    const db = await connectDB()
    const { id } = context.params
    const programUpdates: Partial<Program> = await request.json()

    // Check if program exists
    const existingProgram = await db.collection('programs').findOne({ _id: new ObjectId(id) })
    if (!existingProgram) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Check if user has permission to update this program
    if (session.user.role !== 'admin' && existingProgram.conductedBy !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Validate dates if provided
    if (programUpdates.startDate && programUpdates.endDate) {
      const startDate = new Date(programUpdates.startDate)
      const endDate = new Date(programUpdates.endDate)
      if (endDate <= startDate) {
        return NextResponse.json({
          error: 'End date must be after start date'
        }, { status: 400 })
      }
    }

    // Validate session counts if provided
    if (programUpdates.totalSessions !== undefined && programUpdates.totalSessions < 1) {
      return NextResponse.json({
        error: 'Total sessions must be at least 1'
      }, { status: 400 })
    }

    if (programUpdates.minimumSessionsForCompletion !== undefined &&
        programUpdates.totalSessions !== undefined &&
        programUpdates.minimumSessionsForCompletion > programUpdates.totalSessions) {
      return NextResponse.json({
        error: 'Minimum sessions for completion cannot exceed total sessions'
      }, { status: 400 })
    }

    // Don't allow updating certain protected fields
    const { _id, programCode, conductedBy, createdAt, enrolledParticipants, completedParticipants, ...allowedUpdates } = programUpdates

    // Add updated timestamp
    const updatedProgram = {
      ...allowedUpdates,
      updatedAt: new Date().toISOString(),
      // Ensure numeric fields are numbers if provided
      ...(allowedUpdates.expectedParticipants !== undefined && {
        expectedParticipants: Number(allowedUpdates.expectedParticipants)
      }),
      ...(allowedUpdates.totalSessions !== undefined && {
        totalSessions: Number(allowedUpdates.totalSessions)
      }),
      ...(allowedUpdates.minimumSessionsForCompletion !== undefined && {
        minimumSessionsForCompletion: Number(allowedUpdates.minimumSessionsForCompletion)
      })
    }

    const result = await db.collection('programs').updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedProgram }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Return the updated program
    const updated = await db.collection('programs').findOne({ _id: new ObjectId(id) })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update program error:', error)
    return NextResponse.json({ error: 'Failed to update program' }, { status: 500 })
  }
}

async function handleDeleteProgram(request: NextRequest, session: AuthSession, context: { params: { id: string } }) {
  try {
    const db = await connectDB()
    const { id } = context.params

    // Check if program exists
    const existingProgram = await db.collection('programs').findOne({ _id: new ObjectId(id) })
    if (!existingProgram) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Check if user has permission to delete this program
    if (session.user.role !== 'admin' && existingProgram.conductedBy !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if program has any sessions or participants
    const sessionsCount = await db.collection('sessions').countDocuments({ programId: id })
    const participantsCount = await db.collection('program_participants').countDocuments({ programId: id })

    if (sessionsCount > 0 || participantsCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete program that has sessions or participants. Please remove them first.'
      }, { status: 400 })
    }

    const result = await db.collection('programs').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete program error:', error)
    return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 })
  }
}

export const GET = createAuthHandler(handleGetProgram, 'any')
export const PUT = createAuthHandler(handleUpdateProgram, 'any')
export const DELETE = createAuthHandler(handleDeleteProgram, 'any')