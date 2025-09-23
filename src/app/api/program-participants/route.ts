import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { ProgramParticipant } from '@/types/product'
import { createAuthHandler, AuthSession } from '@/lib/auth-middleware'
import { ObjectId } from 'mongodb'

async function handleGetProgramParticipants(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const url = new URL(request.url)
    const programId = url.searchParams.get('programId')

    let query = {}

    if (programId) {
      // Get participants for a specific program
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
      // Get all participants user has access to
      if (session.user.role !== 'admin') {
        // Get programs conducted by this user
        const userPrograms = await db.collection('programs').find({ conductedBy: session.user.id }).toArray()
        const programIds = userPrograms.map(p => p._id.toString())
        query = { programId: { $in: programIds } }
      }
    }

    const participants = await db.collection('program_participants').find(query).toArray()

    // Populate program information
    const participantsWithDetails = await Promise.all(
      participants.map(async (participant) => {
        if (participant.programId) {
          const program = await db.collection('programs').findOne({
            _id: new ObjectId(participant.programId)
          })
          if (program) {
            participant.programTitle = program.title
            participant.programCode = program.programCode
            participant.programTotalSessions = program.totalSessions
            participant.programMinimumSessions = program.minimumSessionsForCompletion
          }
        }
        return participant
      })
    )

    return NextResponse.json(participantsWithDetails)
  } catch (error) {
    console.error('Fetch program participants error:', error)
    return NextResponse.json({ error: 'Failed to fetch program participants' }, { status: 500 })
  }
}

async function handleEnrollParticipant(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const participantData: ProgramParticipant = await request.json()

    // Validate required fields
    if (!participantData.programId || !participantData.name || !participantData.age ||
        !participantData.gender || !participantData.idNumber || !participantData.phoneNumber) {
      return NextResponse.json({
        error: 'Program ID, name, age, gender, ID number, and phone number are required'
      }, { status: 400 })
    }

    // Validate gender field
    if (!['male', 'female', 'other'].includes(participantData.gender)) {
      return NextResponse.json({
        error: 'Gender must be male, female, or other'
      }, { status: 400 })
    }

    // Get program details and verify permission
    const program = await db.collection('programs').findOne({ _id: new ObjectId(participantData.programId) })
    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Check if user has permission to enroll participants in this program
    if (session.user.role !== 'admin' && program.conductedBy !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if program is still accepting enrollments
    if (program.status === 'completed' || program.status === 'cancelled') {
      return NextResponse.json({
        error: 'Cannot enroll participants in a completed or cancelled program'
      }, { status: 400 })
    }

    // Check if participant is already enrolled in this program (by ID number)
    const existingParticipant = await db.collection('program_participants')
      .findOne({ programId: participantData.programId, idNumber: participantData.idNumber })

    if (existingParticipant) {
      return NextResponse.json({
        error: 'Participant with this ID number is already enrolled in this program'
      }, { status: 400 })
    }

    // Check program capacity
    const currentParticipants = await db.collection('program_participants')
      .countDocuments({ programId: participantData.programId, status: { $in: ['enrolled', 'active'] } })

    if (currentParticipants >= program.expectedParticipants) {
      return NextResponse.json({
        error: 'Program has reached its capacity limit'
      }, { status: 400 })
    }

    // Create or find existing participant record (for cross-program tracking)
    let participantId = participantData.participantId
    if (!participantId) {
      // Check if participant exists in the system by ID number
      const existingParticipantRecord = await db.collection('unique_participants')
        .findOne({ idNumber: participantData.idNumber })

      if (existingParticipantRecord) {
        participantId = existingParticipantRecord._id.toString()

        // Update participant info if provided data is more recent
        await db.collection('unique_participants').updateOne(
          { _id: existingParticipantRecord._id },
          {
            $set: {
              name: participantData.name,
              age: participantData.age,
              gender: participantData.gender,
              phoneNumber: participantData.phoneNumber,
              specialStatus: participantData.specialStatus || {
                isDisabled: false,
                isWounded: false,
                isSeparated: false,
                isUnaccompanied: false
              },
              lastUpdated: new Date().toISOString()
            }
          }
        )
      } else {
        // Create new unique participant record
        const newParticipant = {
          name: participantData.name,
          age: participantData.age,
          gender: participantData.gender,
          idNumber: participantData.idNumber,
          phoneNumber: participantData.phoneNumber,
          specialStatus: participantData.specialStatus || {
            isDisabled: false,
            isWounded: false,
            isSeparated: false,
            isUnaccompanied: false
          },
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }

        const participantResult = await db.collection('unique_participants').insertOne(newParticipant)
        participantId = participantResult.insertedId.toString()
      }
    }

    // Create program enrollment record
    const newProgramParticipant = {
      programId: participantData.programId,
      participantId,
      name: participantData.name,
      age: participantData.age,
      gender: participantData.gender,
      idNumber: participantData.idNumber,
      phoneNumber: participantData.phoneNumber,
      specialStatus: participantData.specialStatus || {
        isDisabled: false,
        isWounded: false,
        isSeparated: false,
        isUnaccompanied: false
      },
      enrollmentDate: new Date().toISOString(),
      status: 'enrolled' as const,
      sessionsAttended: 0,
      sessionsCompleted: 0,
      attendanceRate: 0,
      overallMaterialsReceived: [],
      notes: participantData.notes || ''
    }

    const result = await db.collection('program_participants').insertOne(newProgramParticipant)

    // Update program enrolled participants count
    await db.collection('programs').updateOne(
      { _id: new ObjectId(participantData.programId) },
      { $inc: { enrolledParticipants: 1 } }
    )

    return NextResponse.json({ _id: result.insertedId, ...newProgramParticipant })
  } catch (error) {
    console.error('Enroll participant error:', error)
    return NextResponse.json({ error: 'Failed to enroll participant' }, { status: 500 })
  }
}

// Authenticated users can access program participants (with role-based filtering)
export const GET = createAuthHandler(handleGetProgramParticipants, 'any')
export const POST = createAuthHandler(handleEnrollParticipant, 'any')