import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { SessionAttendance } from '@/types/product'
import { createAuthHandler, AuthSession } from '@/lib/auth-middleware'
import { calculateAttendanceRate, hasCompletedProgram } from '@/lib/workshop-utils'
import { ObjectId } from 'mongodb'

async function handleGetSessionAttendance(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId')
    const programParticipantId = url.searchParams.get('programParticipantId')

    let query = {}

    if (sessionId) {
      query = { sessionId }

      // Check if user has permission to view this session's attendance
      const sessionDoc = await db.collection('sessions').findOne({ _id: new ObjectId(sessionId) })
      if (!sessionDoc) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      const program = await db.collection('programs').findOne({
        _id: new ObjectId(sessionDoc.programId)
      })
      if (!program) {
        return NextResponse.json({ error: 'Associated program not found' }, { status: 404 })
      }

      if (session.user.role !== 'admin' && program.conductedBy !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    } else if (programParticipantId) {
      query = { programParticipantId }

      // Check if user has permission to view this participant's attendance
      const participant = await db.collection('program_participants').findOne({
        _id: new ObjectId(programParticipantId)
      })
      if (!participant) {
        return NextResponse.json({ error: 'Program participant not found' }, { status: 404 })
      }

      const program = await db.collection('programs').findOne({
        _id: new ObjectId(participant.programId)
      })
      if (!program) {
        return NextResponse.json({ error: 'Associated program not found' }, { status: 404 })
      }

      if (session.user.role !== 'admin' && program.conductedBy !== session.user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    } else {
      // Get all attendance records user has access to
      if (session.user.role !== 'admin') {
        // Get programs conducted by this user
        const userPrograms = await db.collection('programs').find({ conductedBy: session.user.id }).toArray()
        const programIds = userPrograms.map(p => p._id.toString())

        // Get participants from these programs
        const userParticipants = await db.collection('program_participants')
          .find({ programId: { $in: programIds } })
          .toArray()
        const participantIds = userParticipants.map(p => p._id.toString())

        query = { programParticipantId: { $in: participantIds } }
      }
    }

    const attendanceRecords = await db.collection('session_attendance')
      .find(query)
      .sort({ recordedAt: -1 })
      .toArray()

    // Populate session and participant information
    const attendanceWithDetails = await Promise.all(
      attendanceRecords.map(async (attendance) => {
        // Get session details
        if (attendance.sessionId) {
          const sessionDoc = await db.collection('sessions').findOne({
            _id: new ObjectId(attendance.sessionId)
          })
          if (sessionDoc) {
            attendance.sessionTitle = sessionDoc.title
            attendance.sessionCode = sessionDoc.sessionCode
            attendance.sessionNumber = sessionDoc.sessionNumber
            attendance.sessionDate = sessionDoc.date
          }
        }

        // Get participant details
        if (attendance.programParticipantId) {
          const participant = await db.collection('program_participants').findOne({
            _id: new ObjectId(attendance.programParticipantId)
          })
          if (participant) {
            attendance.participantName = participant.name
            attendance.participantAge = participant.age
            attendance.participantGender = participant.gender
          }
        }

        return attendance
      })
    )

    return NextResponse.json(attendanceWithDetails)
  } catch (error) {
    console.error('Fetch session attendance error:', error)
    return NextResponse.json({ error: 'Failed to fetch session attendance' }, { status: 500 })
  }
}

async function handleRecordAttendance(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const attendanceData: SessionAttendance = await request.json()

    // Validate required fields
    if (!attendanceData.sessionId || !attendanceData.programParticipantId || !attendanceData.attendanceStatus) {
      return NextResponse.json({
        error: 'Session ID, program participant ID, and attendance status are required'
      }, { status: 400 })
    }

    // Validate attendance status
    const validStatuses = ['registered', 'attended', 'absent', 'late', 'left-early']
    if (!validStatuses.includes(attendanceData.attendanceStatus)) {
      return NextResponse.json({
        error: 'Invalid attendance status. Must be one of: registered, attended, absent, late, left-early'
      }, { status: 400 })
    }

    // Get session details
    const sessionDoc = await db.collection('sessions').findOne({
      _id: new ObjectId(attendanceData.sessionId)
    })
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

    if (session.user.role !== 'admin' && program.conductedBy !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get participant details
    const participant = await db.collection('program_participants').findOne({
      _id: new ObjectId(attendanceData.programParticipantId)
    })
    if (!participant) {
      return NextResponse.json({ error: 'Program participant not found' }, { status: 404 })
    }

    // Verify participant is enrolled in the same program as the session
    if (participant.programId !== sessionDoc.programId) {
      return NextResponse.json({
        error: 'Participant is not enrolled in the program this session belongs to'
      }, { status: 400 })
    }

    // Check if attendance already recorded for this participant in this session
    const existingAttendance = await db.collection('session_attendance').findOne({
      sessionId: attendanceData.sessionId,
      programParticipantId: attendanceData.programParticipantId
    })

    if (existingAttendance) {
      return NextResponse.json({
        error: 'Attendance already recorded for this participant in this session'
      }, { status: 400 })
    }

    // Create attendance record
    const now = new Date().toISOString()
    const newAttendance = {
      sessionId: attendanceData.sessionId,
      programParticipantId: attendanceData.programParticipantId,
      participantName: participant.name,
      attendanceStatus: attendanceData.attendanceStatus,
      checkInTime: attendanceData.checkInTime,
      checkOutTime: attendanceData.checkOutTime,
      sessionMaterialsReceived: attendanceData.sessionMaterialsReceived || [],
      sessionPerformance: attendanceData.sessionPerformance,
      sessionNotes: attendanceData.sessionNotes || '',
      recordedBy: session.user.id,
      recordedAt: now
    }

    const result = await db.collection('session_attendance').insertOne(newAttendance)

    // Update participant's attendance statistics
    const isAttended = ['attended', 'late', 'left-early'].includes(attendanceData.attendanceStatus)
    const isCompleted = attendanceData.sessionPerformance &&
                       ['excellent', 'good', 'satisfactory'].includes(attendanceData.sessionPerformance)

    const participantUpdates: any = {}
    if (isAttended) {
      participantUpdates.$inc = { sessionsAttended: 1 }
    }
    if (isCompleted) {
      participantUpdates.$inc = {
        ...participantUpdates.$inc,
        sessionsCompleted: 1
      }
    }

    // Update material tracking if materials were received
    if (attendanceData.sessionMaterialsReceived && attendanceData.sessionMaterialsReceived.length > 0) {
      for (const material of attendanceData.sessionMaterialsReceived) {
        const existingMaterial = participant.overallMaterialsReceived?.find(
          m => m.productId === material.productId
        )

        if (existingMaterial) {
          // Update existing material tracking
          await db.collection('program_participants').updateOne(
            {
              _id: new ObjectId(attendanceData.programParticipantId),
              'overallMaterialsReceived.productId': material.productId
            },
            {
              $inc: { 'overallMaterialsReceived.$.totalQuantity': material.quantity },
              $push: { 'overallMaterialsReceived.$.sessionsReceived': sessionDoc.sessionNumber }
            }
          )
        } else {
          // Add new material tracking
          await db.collection('program_participants').updateOne(
            { _id: new ObjectId(attendanceData.programParticipantId) },
            {
              $push: {
                overallMaterialsReceived: {
                  productId: material.productId,
                  productName: material.productName,
                  totalQuantity: material.quantity,
                  sessionsReceived: [sessionDoc.sessionNumber]
                }
              }
            }
          )
        }
      }
    }

    if (Object.keys(participantUpdates).length > 0) {
      await db.collection('program_participants').updateOne(
        { _id: new ObjectId(attendanceData.programParticipantId) },
        participantUpdates
      )
    }

    // Recalculate participant's attendance rate
    const totalSessionsHeld = await db.collection('sessions')
      .countDocuments({
        programId: sessionDoc.programId,
        status: { $in: ['completed', 'ongoing'] }
      })

    if (totalSessionsHeld > 0) {
      const attendanceRate = calculateAttendanceRate(
        (participant.sessionsAttended || 0) + (isAttended ? 1 : 0),
        totalSessionsHeld
      )

      // Check if participant has completed the program
      const hasCompleted = hasCompletedProgram(
        (participant.sessionsAttended || 0) + (isAttended ? 1 : 0),
        program.minimumSessionsForCompletion
      )

      const programOutcome = hasCompleted ? 'completed' :
                           attendanceRate >= 50 ? 'partially-completed' :
                           'not-completed'

      await db.collection('program_participants').updateOne(
        { _id: new ObjectId(attendanceData.programParticipantId) },
        {
          $set: {
            attendanceRate,
            programOutcome,
            ...(hasCompleted && participant.status !== 'completed' && {
              status: 'completed',
              completionDate: now
            })
          }
        }
      )
    }

    // Update session's actual participants count
    const sessionAttendedCount = await db.collection('session_attendance')
      .countDocuments({
        sessionId: attendanceData.sessionId,
        attendanceStatus: { $in: ['attended', 'late', 'left-early'] }
      })

    await db.collection('sessions').updateOne(
      { _id: new ObjectId(attendanceData.sessionId) },
      {
        $set: {
          actualParticipants: sessionAttendedCount,
          attendanceRate: Math.round((sessionAttendedCount / sessionDoc.expectedParticipants) * 100)
        }
      }
    )

    return NextResponse.json({ _id: result.insertedId, ...newAttendance })
  } catch (error) {
    console.error('Record attendance error:', error)
    return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 })
  }
}

// Authenticated users can access session attendance (with role-based filtering)
export const GET = createAuthHandler(handleGetSessionAttendance, 'any')
export const POST = createAuthHandler(handleRecordAttendance, 'any')