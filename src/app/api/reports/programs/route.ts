import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { createAuthHandler, AuthSession } from '@/lib/auth-middleware'

async function handleGetProgramReports(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const url = new URL(request.url)
    const programId = url.searchParams.get('programId')

    let programQuery = {}
    if (programId) {
      programQuery = { _id: new ObjectId(programId) }
    } else if (session.user.role !== 'admin') {
      // Regular users can only see their own programs
      programQuery = { conductedBy: session.user.id }
    }

    // Get programs with detailed information
    const programs = await db.collection('programs').find(programQuery).toArray()

    if (programs.length === 0) {
      return NextResponse.json([])
    }

    // Optimized: Batch fetch all related data to eliminate N+1 queries
    const programIds = programs.map(p => p._id!.toString())

    // Get all sessions for these programs
    const allSessions = await db.collection('sessions').find({
      programId: { $in: programIds }
    }).toArray()

    // Get all program participants for these programs
    const allParticipants = await db.collection('program_participants').find({
      programId: { $in: programIds }
    }).toArray()

    // Get all session attendance records for these programs
    const sessionIds = allSessions.map(s => s._id!.toString())
    const allAttendance = await db.collection('session_attendance').find({
      sessionId: { $in: sessionIds }
    }).toArray()

    // Group data by program ID for O(1) lookup
    const sessionsByProgram = new Map<string, any[]>()
    const participantsByProgram = new Map<string, any[]>()
    const attendanceBySession = new Map<string, any[]>()

    allSessions.forEach(session => {
      const programId = session.programId
      if (!sessionsByProgram.has(programId)) {
        sessionsByProgram.set(programId, [])
      }
      sessionsByProgram.get(programId)!.push(session)
    })

    allParticipants.forEach(participant => {
      const programId = participant.programId
      if (!participantsByProgram.has(programId)) {
        participantsByProgram.set(programId, [])
      }
      participantsByProgram.get(programId)!.push(participant)
    })

    allAttendance.forEach(attendance => {
      const sessionId = attendance.sessionId
      if (!attendanceBySession.has(sessionId)) {
        attendanceBySession.set(sessionId, [])
      }
      attendanceBySession.get(sessionId)!.push(attendance)
    })

    // Process programs with O(1) lookups
    const detailedReports = programs.map((program) => {
      const programId = program._id!.toString()
      const sessions = sessionsByProgram.get(programId) || []
      const participants = participantsByProgram.get(programId) || []

      // Calculate program-level statistics
      const totalEnrolledParticipants = participants.length
      const completedParticipants = participants.filter(p => p.status === 'completed').length
      const activeParticipants = participants.filter(p => ['enrolled', 'active'].includes(p.status)).length
      const droppedOutParticipants = participants.filter(p => p.status === 'dropped-out').length

      // Session statistics
      const totalSessions = sessions.length
      const completedSessions = sessions.filter(s => s.status === 'completed').length
      const plannedSessions = sessions.filter(s => s.status === 'planned').length

      // Calculate unique beneficiaries - participants who attended at least one session
      const uniqueAttendees = new Set<string>()
      const participantSessionData = new Map<string, {
        participant: any,
        sessionsAttended: number,
        sessionsCompleted: number,
        totalMaterialsReceived: any[],
        attendanceDetails: any[]
      }>()

      // Initialize participant data
      participants.forEach(participant => {
        participantSessionData.set(participant._id.toString(), {
          participant,
          sessionsAttended: 0,
          sessionsCompleted: 0,
          totalMaterialsReceived: [],
          attendanceDetails: []
        })
      })

      // Process attendance for all sessions
      sessions.forEach(session => {
        const sessionAttendance = attendanceBySession.get(session._id!.toString()) || []

        sessionAttendance.forEach(attendance => {
          const participantId = attendance.programParticipantId
          const data = participantSessionData.get(participantId)

          if (data) {
            data.attendanceDetails.push({
              sessionId: session._id!.toString(),
              sessionNumber: session.sessionNumber,
              sessionTitle: session.title,
              sessionDate: session.date,
              attendanceStatus: attendance.attendanceStatus,
              materialsReceived: attendance.sessionMaterialsReceived || [],
              sessionPerformance: attendance.sessionPerformance
            })

            // Count as attended if status indicates presence
            if (['attended', 'late', 'left-early'].includes(attendance.attendanceStatus)) {
              data.sessionsAttended++
              uniqueAttendees.add(participantId)
            }

            // Count as completed if performance is satisfactory or better
            if (attendance.sessionPerformance &&
                ['excellent', 'good', 'satisfactory'].includes(attendance.sessionPerformance)) {
              data.sessionsCompleted++
            }

            // Aggregate materials received
            if (attendance.sessionMaterialsReceived) {
              attendance.sessionMaterialsReceived.forEach(material => {
                const existingMaterial = data.totalMaterialsReceived.find(m => m.productId === material.productId)
                if (existingMaterial) {
                  existingMaterial.totalQuantity += material.quantity
                  existingMaterial.sessionsReceived.push(session.sessionNumber)
                } else {
                  data.totalMaterialsReceived.push({
                    ...material,
                    totalQuantity: material.quantity,
                    sessionsReceived: [session.sessionNumber]
                  })
                }
              })
            }
          }
        })
      })

      // Calculate demographics from enrolled participants
      const ageGroups = {
        '0-17': participants.filter(p => p.age < 18).length,
        '18-35': participants.filter(p => p.age >= 18 && p.age <= 35).length,
        '36-55': participants.filter(p => p.age >= 36 && p.age <= 55).length,
        '56+': participants.filter(p => p.age > 55).length
      }

      const genderDistribution = {
        male: participants.filter(p => p.gender === 'male').length,
        female: participants.filter(p => p.gender === 'female').length,
        other: participants.filter(p => p.gender === 'other').length
      }

      // Special status statistics
      const specialStatus = {
        disabled: participants.filter(p => p.specialStatus?.isDisabled).length,
        wounded: participants.filter(p => p.specialStatus?.isWounded).length,
        separated: participants.filter(p => p.specialStatus?.isSeparated).length,
        unaccompanied: participants.filter(p => p.specialStatus?.isUnaccompanied).length
      }

      // Material distribution summary across all sessions
      const materialDistribution: any = {}
      Array.from(participantSessionData.values()).forEach(data => {
        data.totalMaterialsReceived.forEach(material => {
          if (!materialDistribution[material.productName]) {
            materialDistribution[material.productName] = {
              totalQuantity: 0,
              uniqueParticipants: new Set(),
              sessionsDistributed: new Set()
            }
          }
          materialDistribution[material.productName].totalQuantity += material.totalQuantity
          materialDistribution[material.productName].uniqueParticipants.add(data.participant._id.toString())
          material.sessionsReceived.forEach(sessionNum => {
            materialDistribution[material.productName].sessionsDistributed.add(sessionNum)
          })
        })
      })

      // Convert Sets to counts
      Object.keys(materialDistribution).forEach(productName => {
        materialDistribution[productName].participantCount = materialDistribution[productName].uniqueParticipants.size
        materialDistribution[productName].sessionCount = materialDistribution[productName].sessionsDistributed.size
        delete materialDistribution[productName].uniqueParticipants
        delete materialDistribution[productName].sessionsDistributed
      })

      // Calculate completion rate based on minimum sessions requirement
      const eligibleForCompletion = Array.from(participantSessionData.values())
        .filter(data => data.sessionsAttended >= program.minimumSessionsForCompletion).length

      // Calculate average attendance rate across all sessions
      const totalPossibleAttendance = participants.length * completedSessions
      const totalActualAttendance = Array.from(participantSessionData.values())
        .reduce((sum, data) => sum + data.sessionsAttended, 0)
      const overallAttendanceRate = totalPossibleAttendance > 0 ?
        Math.round((totalActualAttendance / totalPossibleAttendance) * 100) : 0

      return {
        program: {
          ...program,
          _id: program._id!.toString()
        },
        statistics: {
          // Participant statistics
          totalEnrolledParticipants,
          uniqueAttendees: uniqueAttendees.size, // This is the key metric for reporting
          completedParticipants,
          activeParticipants,
          droppedOutParticipants,
          eligibleForCompletion,

          // Session statistics
          totalSessions,
          completedSessions,
          plannedSessions,

          // Rates and percentages
          overallAttendanceRate,
          completionRate: totalEnrolledParticipants > 0 ?
            Math.round((completedParticipants / totalEnrolledParticipants) * 100) : 0,
          retentionRate: totalEnrolledParticipants > 0 ?
            Math.round(((totalEnrolledParticipants - droppedOutParticipants) / totalEnrolledParticipants) * 100) : 0,

          // Demographics
          ageGroups,
          genderDistribution,
          specialStatus
        },
        sessions: sessions.map(session => ({
          ...session,
          _id: session._id!.toString(),
          attendanceCount: (attendanceBySession.get(session._id!.toString()) || [])
            .filter(a => ['attended', 'late', 'left-early'].includes(a.attendanceStatus)).length,
          totalAttendanceRecords: (attendanceBySession.get(session._id!.toString()) || []).length
        })),
        participants: Array.from(participantSessionData.values()).map(data => ({
          ...data.participant,
          _id: data.participant._id.toString(),
          sessionsAttended: data.sessionsAttended,
          sessionsCompleted: data.sessionsCompleted,
          attendanceRate: completedSessions > 0 ?
            Math.round((data.sessionsAttended / completedSessions) * 100) : 0,
          isEligibleForCompletion: data.sessionsAttended >= program.minimumSessionsForCompletion,
          totalMaterialsReceived: data.totalMaterialsReceived,
          attendanceDetails: data.attendanceDetails
        })),
        materialDistribution
      }
    })

    return NextResponse.json(detailedReports)
  } catch (error) {
    console.error('Get program reports error:', error)
    return NextResponse.json({ error: 'Failed to get program reports' }, { status: 500 })
  }
}

export const GET = createAuthHandler(handleGetProgramReports, 'any')