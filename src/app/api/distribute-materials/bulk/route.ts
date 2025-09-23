import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { createAuthHandler, AuthSession, checkWorkshopPermission } from '@/lib/auth-middleware'

async function handleBulkDistributeMaterials(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const { workshopId, productId, quantityPerParticipant } = await request.json()

    // Validate required fields
    if (!workshopId || !productId || !quantityPerParticipant) {
      return NextResponse.json({ error: 'Workshop ID, product ID, and quantity per participant are required' }, { status: 400 })
    }

    if (quantityPerParticipant <= 0) {
      return NextResponse.json({ error: 'Quantity per participant must be greater than 0' }, { status: 400 })
    }

    // Get workshop details and verify permission
    const workshop = await db.collection('workshops').findOne({ _id: new ObjectId(workshopId) })
    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    // Check if user has permission using middleware helper
    if (!await checkWorkshopPermission(session, workshop.conductedBy)) {
      return NextResponse.json({ error: 'You can only distribute materials for workshops you conduct' }, { status: 403 })
    }

    // Get all participants for this workshop
    const participants = await db.collection('participants')
      .find({ workshopId: workshopId })
      .toArray()

    if (participants.length === 0) {
      return NextResponse.json({ error: 'No participants found for this workshop' }, { status: 400 })
    }

    const totalQuantityNeeded = participants.length * quantityPerParticipant

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
        error: `Insufficient quantity. You have ${userBalance.availableQuantity} but need ${totalQuantityNeeded} (${participants.length} participants × ${quantityPerParticipant} each)`
      }, { status: 400 })
    }

    // Get product details for recording
    const product = await db.collection('products').findOne({ _id: new ObjectId(productId) })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Start transaction-like operations
    const now = new Date().toISOString()

    // 1. Update user balance (deduct total quantity)
    await db.collection('user_balances').updateOne(
      { userId: session.user.id, productId: productId },
      { $inc: { availableQuantity: -totalQuantityNeeded } }
    )

    // 2. Update all participants' materials received
    const participantIds = participants.map(p => p._id)
    await db.collection('participants').updateMany(
      { _id: { $in: participantIds } },
      {
        $push: {
          materialsReceived: {
            productId: productId,
            productName: product.name,
            quantity: quantityPerParticipant,
            receivedAt: now
          }
        } as any
      }
    )

    // 3. Update workshop's materials used
    const existingMaterial = workshop.materialsUsed?.find((m: any) => m.productId === productId)
    if (existingMaterial) {
      // Update existing material entry
      await db.collection('workshops').updateOne(
        { _id: new ObjectId(workshopId), 'materialsUsed.productId': productId },
        {
          $inc: { 'materialsUsed.$.quantity': totalQuantityNeeded },
          $push: { 'materialsUsed.$.distributedTo': { $each: participantIds } }
        }
      )
    } else {
      // Add new material entry
      await db.collection('workshops').updateOne(
        { _id: new ObjectId(workshopId) },
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
    const transactions = participants.map(participant => ({
      fromUserId: session.user.id,
      toUserId: participant._id.toString(),
      productId: productId,
      productName: product.name,
      quantity: quantityPerParticipant,
      type: 'bulk_distribution',
      timestamp: now,
      notes: `Bulk distributed to participant ${participant.name} in workshop ${workshop.title}`,
      workshopId: workshopId,
      participantId: participant._id.toString()
    }))

    await db.collection('stockTransactions').insertMany(transactions)

    return NextResponse.json({
      success: true,
      distributed: {
        participantCount: participants.length,
        quantityPerParticipant: quantityPerParticipant,
        totalQuantity: totalQuantityNeeded,
        productName: product.name
      }
    })
  } catch (error) {
    console.error('Bulk distribute materials error:', error)
    return NextResponse.json({ error: 'Failed to bulk distribute materials' }, { status: 500 })
  }
}

export const POST = createAuthHandler(handleBulkDistributeMaterials, 'any')