import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { createAuthHandler, AuthSession, checkWorkshopPermission } from '@/lib/auth-middleware'

async function handleGetWorkshopReports(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const url = new URL(request.url)
    const workshopId = url.searchParams.get('workshopId')

    let workshopQuery = {}
    if (workshopId) {
      workshopQuery = { _id: new ObjectId(workshopId) }
    } else if (session.user.role !== 'admin') {
      // Regular users can only see their own workshops
      workshopQuery = { conductedBy: session.user.id }
    }

    // Get workshops with detailed information
    const workshops = await db.collection('workshops').find(workshopQuery).toArray()

    if (workshops.length === 0) {
      return NextResponse.json([])
    }

    // Optimized: Batch fetch all participants and transactions to eliminate N+1 queries
    const workshopIds = workshops.map(w => w._id!.toString())

    // Single query to get all participants for all workshops
    const allParticipants = await db.collection('participants').find({
      workshopId: { $in: workshopIds }
    }).toArray()

    // Single query to get all stock transactions for all workshops
    const allTransactions = await db.collection('stockTransactions').find({
      workshopId: { $in: workshopIds },
      type: 'distribution'
    }).toArray()

    // Group participants and transactions by workshop ID for O(1) lookup
    const participantsByWorkshop = new Map<string, any[]>()
    const transactionsByWorkshop = new Map<string, any[]>()

    allParticipants.forEach(participant => {
      const workshopId = participant.workshopId
      if (!participantsByWorkshop.has(workshopId)) {
        participantsByWorkshop.set(workshopId, [])
      }
      participantsByWorkshop.get(workshopId)!.push(participant)
    })

    allTransactions.forEach(transaction => {
      const workshopId = transaction.workshopId
      if (!transactionsByWorkshop.has(workshopId)) {
        transactionsByWorkshop.set(workshopId, [])
      }
      transactionsByWorkshop.get(workshopId)!.push(transaction)
    })

    // Now process workshops with O(1) lookups instead of N queries
    const detailedReports = workshops.map((workshop) => {
      const workshopId = workshop._id!.toString()
      const participants = participantsByWorkshop.get(workshopId) || []
      const transactions = transactionsByWorkshop.get(workshopId) || []

      // Calculate statistics
      const totalParticipants = participants.length
      const attendedParticipants = participants.filter(p => p.attendanceStatus === 'attended').length
      const noShowParticipants = participants.filter(p => p.attendanceStatus === 'no-show').length
      const registeredParticipants = participants.filter(p => p.attendanceStatus === 'registered').length

      // Special status statistics
      const disabledParticipants = participants.filter(p => p.specialStatus?.isDisabled).length
      const woundedParticipants = participants.filter(p => p.specialStatus?.isWounded).length
      const separatedParticipants = participants.filter(p => p.specialStatus?.isSeparated).length
      const unaccompaniedParticipants = participants.filter(p => p.specialStatus?.isUnaccompanied).length

      // Material distribution summary
      const materialsSummary: any = {}
      transactions.forEach((transaction: any) => {
        if (!materialsSummary[transaction.productName]) {
          materialsSummary[transaction.productName] = {
            totalQuantity: 0,
            participantCount: 0,
            participants: new Set()
          }
        }
        materialsSummary[transaction.productName].totalQuantity += transaction.quantity
        materialsSummary[transaction.productName].participants.add(transaction.participantId)
      })

      // Convert Set to count for each material
      Object.keys(materialsSummary).forEach(productName => {
        materialsSummary[productName].participantCount = materialsSummary[productName].participants.size
        delete materialsSummary[productName].participants
      })

      // Age distribution
      const ageGroups = {
        '0-17': participants.filter(p => p.age < 18).length,
        '18-35': participants.filter(p => p.age >= 18 && p.age <= 35).length,
        '36-55': participants.filter(p => p.age >= 36 && p.age <= 55).length,
        '56+': participants.filter(p => p.age > 55).length
      }

      return {
        workshop: {
          ...workshop,
          _id: workshop._id!.toString()
        },
        statistics: {
          totalParticipants,
          attendedParticipants,
          noShowParticipants,
          registeredParticipants,
          attendanceRate: totalParticipants > 0 ? Math.round((attendedParticipants / totalParticipants) * 100) : 0,
          specialStatus: {
            disabled: disabledParticipants,
            wounded: woundedParticipants,
            separated: separatedParticipants,
            unaccompanied: unaccompaniedParticipants
          },
          ageGroups
        },
        participants: participants.map(p => ({
          ...p,
          _id: p._id!.toString(),
          workshopId: p.workshopId
        })),
        materialDistribution: materialsSummary,
        transactions: transactions.map(t => ({
          ...t,
          _id: t._id!.toString()
        }))
      }
    })

    return NextResponse.json(detailedReports)
  } catch (error) {
    console.error('Get workshop reports error:', error)
    return NextResponse.json({ error: 'Failed to get workshop reports' }, { status: 500 })
  }
}

export const GET = createAuthHandler(handleGetWorkshopReports, 'any')