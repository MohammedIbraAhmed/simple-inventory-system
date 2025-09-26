import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { createAuthHandler, AuthSession } from '@/lib/auth-middleware'

async function handleBulkDistributeSessionMaterials(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const { sessionId, productId, quantityPerParticipant } = await request.json()

    // Validate required fields
    if (!sessionId || !productId || !quantityPerParticipant) {
      return NextResponse.json({ error: 'Session ID, product ID, and quantity per participant are required' }, { status: 400 })
    }

    if (quantityPerParticipant <= 0) {
      return NextResponse.json({ error: 'Quantity per participant must be greater than 0' }, { status: 400 })
    }

    // Get session details
    const sessionData = await db.collection('sessions').findOne({ _id: new ObjectId(sessionId) })
    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get program details and verify permission
    const program = await db.collection('programs').findOne({ _id: new ObjectId(sessionData.programId) })
    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Check if user has permission (admin or program conductor)
    if (session.user.role !== 'admin' && program.conductedBy !== session.user.id) {
      return NextResponse.json({ error: 'You can only distribute materials for programs you conduct' }, { status: 403 })
    }

    // Get all attendance records for this session (only those who attended)
    const attendanceRecords = await db.collection('session_attendance')
      .find({
        sessionId: sessionId,
        attendanceStatus: { $in: ['attended', 'late', 'left-early'] }
      })
      .toArray()

    if (attendanceRecords.length === 0) {
      return NextResponse.json({ error: 'No attendees found for this session' }, { status: 400 })
    }

    const totalQuantityNeeded = attendanceRecords.length * quantityPerParticipant

    // Get user's balance for this product
    const userBalance = await db.collection('user_balances').findOne({
      userId: session.user.id,
      productId: productId
    })

    if (!userBalance) {
      return NextResponse.json({ error: 'You do not have this product in your balance' }, { status: 400 })
    }

    if (userBalance.availableQuantity < totalQuantityNeeded) {
      return NextResponse.json({
        error: `Insufficient quantity. You have ${userBalance.availableQuantity} but need ${totalQuantityNeeded} (${attendanceRecords.length} attendees × ${quantityPerParticipant} each)`
      }, { status: 400 })
    }

    // Get product details for recording
    const product = await db.collection('products').findOne({ _id: new ObjectId(productId) })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get program participant details for all attendees
    const programParticipantIds = attendanceRecords.map(record => new ObjectId(record.programParticipantId))
    const programParticipants = await db.collection('program_participants')
      .find({ _id: { $in: programParticipantIds } })
      .toArray()

    // Start transaction-like operations
    const now = new Date().toISOString()

    // 1. Update user balance (deduct total quantity)
    await db.collection('user_balances').updateOne(
      { userId: session.user.id, productId: productId },
      { $inc: { availableQuantity: -totalQuantityNeeded } }
    )

    // 2. Update all attendance records with materials received
    const attendanceIds = attendanceRecords.map(record => record._id)
    await db.collection('session_attendance').updateMany(
      { _id: { $in: attendanceIds } },
      {
        $push: {
          sessionMaterialsReceived: {
            productId: productId,
            productName: product.name,
            quantity: quantityPerParticipant,
            receivedAt: now
          }
        } as any
      }
    )

    // 3. Update session's materials used
    const participantIds = attendanceRecords.map(record => record.programParticipantId)
    const existingMaterial = sessionData.materialsUsed?.find((m: any) => m.productId === productId)
    if (existingMaterial) {
      // Update existing material entry
      await db.collection('sessions').updateOne(
        { _id: new ObjectId(sessionId), 'materialsUsed.productId': productId },
        {
          $inc: { 'materialsUsed.$.quantity': totalQuantityNeeded },
          $push: { 'materialsUsed.$.distributedTo': { $each: participantIds } }
        }
      )
    } else {
      // Add new material entry
      await db.collection('sessions').updateOne(
        { _id: new ObjectId(sessionId) },
        {
          $push: {
            materialsUsed: {
              productId: productId,
              productName: product.name,
              quantity: totalQuantityNeeded,
              distributedTo: participantIds
            }
          } as any
        }
      )
    }

    // 4. Record distribution transactions for each participant
    const transactions = attendanceRecords.map(attendanceRecord => {
      const participant = programParticipants.find(p => p._id.toString() === attendanceRecord.programParticipantId)
      return {
        fromUserId: session.user.id,
        toUserId: attendanceRecord.programParticipantId,
        productId: productId,
        productName: product.name,
        quantity: quantityPerParticipant,
        type: 'session_bulk_distribution',
        timestamp: now,
        notes: `Bulk distributed to participant ${participant?.name || 'Unknown'} in session ${sessionData.title} (Program: ${program.title})`,
        sessionId: sessionId,
        programId: sessionData.programId,
        programParticipantId: attendanceRecord.programParticipantId
      }
    })

    await db.collection('stockTransactions').insertMany(transactions)

    return NextResponse.json({
      success: true,
      distributed: {
        participantCount: attendanceRecords.length,
        quantityPerParticipant: quantityPerParticipant,
        totalQuantity: totalQuantityNeeded,
        productName: product.name,
        sessionTitle: sessionData.title
      }
    })
  } catch (error) {
    console.error('Bulk distribute session materials error:', error)
    return NextResponse.json({ error: 'Failed to bulk distribute session materials' }, { status: 500 })
  }
}

export const POST = createAuthHandler(handleBulkDistributeSessionMaterials, 'any')