import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { createAuthHandler, AuthSession } from '@/lib/auth-middleware'

async function handleDistributeSessionMaterials(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const { programParticipantId, productId, quantity, sessionId } = await request.json()

    // Validate required fields
    if (!programParticipantId || !productId || !quantity || !sessionId) {
      return NextResponse.json({ error: 'Program participant ID, product ID, quantity, and session ID are required' }, { status: 400 })
    }

    // Get program participant details
    const programParticipant = await db.collection('program_participants').findOne({ _id: new ObjectId(programParticipantId) })
    if (!programParticipant) {
      return NextResponse.json({ error: 'Program participant not found' }, { status: 404 })
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

    // Get user's balance for this product
    const userBalance = await db.collection('user_balances').findOne({
      userId: session.user.id,
      productId: productId
    })

    if (!userBalance) {
      return NextResponse.json({ error: 'You do not have this product in your balance' }, { status: 400 })
    }

    if (userBalance.availableQuantity < quantity) {
      return NextResponse.json({ error: 'Insufficient quantity in your balance' }, { status: 400 })
    }

    // Get product details for recording
    const product = await db.collection('products').findOne({ _id: new ObjectId(productId) })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if attendance record exists for this participant in this session
    const attendanceRecord = await db.collection('session_attendance').findOne({
      sessionId: sessionId,
      programParticipantId: programParticipantId
    })

    if (!attendanceRecord) {
      return NextResponse.json({ error: 'Attendance record not found for this participant in this session' }, { status: 404 })
    }

    // Start transaction-like operations
    const now = new Date().toISOString()

    // 1. Update user balance
    await db.collection('user_balances').updateOne(
      { userId: session.user.id, productId: productId },
      { $inc: { availableQuantity: -quantity } }
    )

    // 2. Update session attendance record with materials received
    await db.collection('session_attendance').updateOne(
      { sessionId: sessionId, programParticipantId: programParticipantId },
      {
        $push: {
          sessionMaterialsReceived: {
            productId: productId,
            productName: product.name,
            quantity: quantity,
            receivedAt: now
          }
        } as any
      }
    )

    // 3. Update session's materials used
    const existingMaterial = sessionData.materialsUsed?.find((m: any) => m.productId === productId)
    if (existingMaterial) {
      // Update existing material entry
      await db.collection('sessions').updateOne(
        { _id: new ObjectId(sessionId), 'materialsUsed.productId': productId },
        {
          $inc: { 'materialsUsed.$.quantity': quantity },
          $push: { 'materialsUsed.$.distributedTo': programParticipantId }
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
              quantity: quantity,
              distributedTo: [programParticipantId]
            }
          } as any
        }
      )
    }

    // 4. Record distribution transaction
    await db.collection('stockTransactions').insertOne({
      fromUserId: session.user.id,
      toUserId: programParticipantId, // Using program participant ID as recipient
      productId: productId,
      productName: product.name,
      quantity: quantity,
      type: 'session_distribution',
      timestamp: now,
      notes: `Distributed to participant ${programParticipant.name} in session ${sessionData.title} (Program: ${program.title})`,
      sessionId: sessionId,
      programId: sessionData.programId,
      programParticipantId: programParticipantId
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Distribute session materials error:', error)
    return NextResponse.json({ error: 'Failed to distribute session materials' }, { status: 500 })
  }
}

export const POST = createAuthHandler(handleDistributeSessionMaterials, 'any')