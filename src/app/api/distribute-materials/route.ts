import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { createAuthHandler, AuthSession, checkWorkshopPermission } from '@/lib/auth-middleware'

async function handleDistributeMaterials(request: NextRequest, session: AuthSession) {
  try {
    const db = await connectDB()
    const { participantId, productId, quantity, workshopId } = await request.json()

    // Validate required fields
    if (!participantId || !productId || !quantity || !workshopId) {
      return NextResponse.json({ error: 'Participant ID, product ID, quantity, and workshop ID are required' }, { status: 400 })
    }

    // Get participant details
    const participant = await db.collection('participants').findOne({ _id: new ObjectId(participantId) })
    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
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

    // Start transaction-like operations
    const now = new Date().toISOString()

    // 1. Update user balance
    await db.collection('user_balances').updateOne(
      { userId: session.user.id, productId: productId },
      { $inc: { availableQuantity: -quantity } }
    )

    // 2. Update participant's materials received
    await db.collection('participants').updateOne(
      { _id: new ObjectId(participantId) },
      {
        $push: {
          materialsReceived: {
            productId: productId,
            productName: product.name,
            quantity: quantity,
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
          $inc: { 'materialsUsed.$.quantity': quantity },
          $push: { 'materialsUsed.$.distributedTo': participantId }
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
              quantity: quantity,
              distributedTo: [participantId]
            }
          } as any
        }
      )
    }

    // 4. Record distribution transaction
    await db.collection('stockTransactions').insertOne({
      fromUserId: session.user.id,
      toUserId: participantId, // Using participant ID as recipient
      productId: productId,
      productName: product.name,
      quantity: quantity,
      type: 'distribution',
      timestamp: now,
      notes: `Distributed to participant ${participant.name} in workshop ${workshop.title}`,
      workshopId: workshopId,
      participantId: participantId
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Distribute materials error:', error)
    return NextResponse.json({ error: 'Failed to distribute materials' }, { status: 500 })
  }
}

export const POST = createAuthHandler(handleDistributeMaterials, 'any')