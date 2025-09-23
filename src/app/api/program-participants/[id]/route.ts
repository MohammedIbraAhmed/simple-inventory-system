import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { ProgramParticipant } from '@/types/product'
import { createAuthHandler, AuthSession } from '@/lib/auth-middleware'
import { calculateAttendanceRate, hasCompletedProgram } from '@/lib/workshop-utils'
import { ObjectId } from 'mongodb'

async function handleGetProgramParticipant(request: NextRequest, session: AuthSession, context: { params: { id: string } }) {
  try {
    const db = await connectDB()
    const { id } = context.params

    const participant = await db.collection('program_participants').findOne({ _id: new ObjectId(id) })
    if (!participant) {
      return NextResponse.json({ error: 'Program participant not found' }, { status: 404 })
    }

    // Get program details and check permission
    const program = await db.collection('programs').findOne({
      _id: new ObjectId(participant.programId)
    })
    if (!program) {
      return NextResponse.json({ error: 'Associated program not found' }, { status: 404 })
    }

    // Check if user has permission to view this participant
    if (session.user.role !== 'admin' && program.conductedBy !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Populate program information
    participant.programTitle = program.title
    participant.programCode = program.programCode
    participant.programTotalSessions = program.totalSessions
    participant.programMinimumSessions = program.minimumSessionsForCompletion

    // Get session attendance details
    const attendanceRecords = await db.collection('session_attendance')
      .find({ programParticipantId: id })
      .toArray()

    participant.sessionAttendanceDetails = attendanceRecords

    return NextResponse.json(participant)
  } catch (error) {
    console.error('Fetch program participant error:', error)
    return NextResponse.json({ error: 'Failed to fetch program participant' }, { status: 500 })
  }
}

async function handleUpdateProgramParticipant(request: NextRequest, session: AuthSession, context: { params: { id: string } }) {
  try {
    const db = await connectDB()
    const { id } = context.params
    const participantUpdates: Partial<ProgramParticipant> = await request.json()

    // Check if participant exists
    const existingParticipant = await db.collection('program_participants').findOne({ _id: new ObjectId(id) })
    if (!existingParticipant) {
      return NextResponse.json({ error: 'Program participant not found' }, { status: 404 })
    }

    // Get program details and check permission
    const program = await db.collection('programs').findOne({
      _id: new ObjectId(existingParticipant.programId)
    })
    if (!program) {
      return NextResponse.json({ error: 'Associated program not found' }, { status: 404 })
    }

    // Check if user has permission to update this participant
    if (session.user.role !== 'admin' && program.conductedBy !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Validate gender if provided
    if (participantUpdates.gender && !['male', 'female', 'other'].includes(participantUpdates.gender)) {
      return NextResponse.json({
        error: 'Gender must be male, female, or other'
      }, { status: 400 })
    }

    // Don't allow updating certain protected fields
    const {
      _id,
      programId,
      participantId,
      enrollmentDate,
      sessionsAttended,
      sessionsCompleted,
      attendanceRate,
      overallMaterialsReceived,
      ...allowedUpdates
    } = participantUpdates

    // Handle status changes
    if (allowedUpdates.status) {
      const validStatuses = ['enrolled', 'active', 'completed', 'dropped-out', 'transferred']
      if (!validStatuses.includes(allowedUpdates.status)) {
        return NextResponse.json({
          error: 'Invalid status. Must be one of: enrolled, active, completed, dropped-out, transferred'
        }, { status: 400 })
      }

      // Set completion date if status is completed
      if (allowedUpdates.status === 'completed' && !existingParticipant.completionDate) {
        allowedUpdates.completionDate = new Date().toISOString()
      }

      // Update program counts based on status change
      if (existingParticipant.status !== allowedUpdates.status) {
        const statusChangeUpdates: any = {}

        // Handle enrollment count changes
        if (existingParticipant.status === 'enrolled' || existingParticipant.status === 'active') {
          if (allowedUpdates.status === 'dropped-out' || allowedUpdates.status === 'transferred') {
            statusChangeUpdates.$inc = { enrolledParticipants: -1 }
          }
        }

        // Handle completion count changes
        if (allowedUpdates.status === 'completed' && existingParticipant.status !== 'completed') {
          statusChangeUpdates.$inc = {
            ...statusChangeUpdates.$inc,
            completedParticipants: 1
          }
        } else if (existingParticipant.status === 'completed' && allowedUpdates.status !== 'completed') {
          statusChangeUpdates.$inc = {
            ...statusChangeUpdates.$inc,
            completedParticipants: -1
          }
        }

        if (Object.keys(statusChangeUpdates).length > 0) {
          await db.collection('programs').updateOne(
            { _id: new ObjectId(existingParticipant.programId) },
            statusChangeUpdates
          )
        }
      }
    }

    // Update participant record
    const updatedParticipant = {
      ...allowedUpdates,
      // Ensure numeric fields are numbers if provided
      ...(allowedUpdates.age !== undefined && {
        age: Number(allowedUpdates.age)
      })
    }

    const result = await db.collection('program_participants').updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedParticipant }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Program participant not found' }, { status: 404 })
    }

    // Also update the unique participant record if basic info changed
    if (allowedUpdates.name || allowedUpdates.age || allowedUpdates.gender ||
        allowedUpdates.phoneNumber || allowedUpdates.specialStatus) {
      const uniqueParticipantUpdates: any = {
        lastUpdated: new Date().toISOString()
      }

      if (allowedUpdates.name) uniqueParticipantUpdates.name = allowedUpdates.name
      if (allowedUpdates.age) uniqueParticipantUpdates.age = Number(allowedUpdates.age)
      if (allowedUpdates.gender) uniqueParticipantUpdates.gender = allowedUpdates.gender
      if (allowedUpdates.phoneNumber) uniqueParticipantUpdates.phoneNumber = allowedUpdates.phoneNumber
      if (allowedUpdates.specialStatus) uniqueParticipantUpdates.specialStatus = allowedUpdates.specialStatus

      await db.collection('unique_participants').updateOne(
        { _id: new ObjectId(existingParticipant.participantId) },
        { $set: uniqueParticipantUpdates }
      )
    }

    // Return the updated participant
    const updated = await db.collection('program_participants').findOne({ _id: new ObjectId(id) })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update program participant error:', error)
    return NextResponse.json({ error: 'Failed to update program participant' }, { status: 500 })
  }
}

async function handleDeleteProgramParticipant(request: NextRequest, session: AuthSession, context: { params: { id: string } }) {
  try {
    const db = await connectDB()
    const { id } = context.params

    // Check if participant exists
    const existingParticipant = await db.collection('program_participants').findOne({ _id: new ObjectId(id) })
    if (!existingParticipant) {
      return NextResponse.json({ error: 'Program participant not found' }, { status: 404 })
    }

    // Get program details and check permission
    const program = await db.collection('programs').findOne({
      _id: new ObjectId(existingParticipant.programId)
    })
    if (!program) {
      return NextResponse.json({ error: 'Associated program not found' }, { status: 404 })
    }

    // Check if user has permission to delete this participant
    if (session.user.role !== 'admin' && program.conductedBy !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if participant has attendance records
    const attendanceCount = await db.collection('session_attendance')
      .countDocuments({ programParticipantId: id })

    if (attendanceCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete participant who has session attendance records. Please remove them first or mark participant as dropped-out instead.'
      }, { status: 400 })
    }

    const result = await db.collection('program_participants').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Program participant not found' }, { status: 404 })
    }

    // Update program enrollment count
    await db.collection('programs').updateOne(
      { _id: new ObjectId(existingParticipant.programId) },
      { $inc: { enrolledParticipants: -1 } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete program participant error:', error)
    return NextResponse.json({ error: 'Failed to delete program participant' }, { status: 500 })
  }
}

export const GET = createAuthHandler(handleGetProgramParticipant, 'any')
export const PUT = createAuthHandler(handleUpdateProgramParticipant, 'any')
export const DELETE = createAuthHandler(handleDeleteProgramParticipant, 'any')