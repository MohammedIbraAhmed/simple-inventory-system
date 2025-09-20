import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const participantData = await request.json()

    // Get the existing participant to check permissions
    const existingParticipant = await db.collection('participants').findOne({ _id: new ObjectId(params.id) })
    if (!existingParticipant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    // Check if user has permission (admin or workshop conductor)
    if (session.user.role !== 'admin') {
      const workshop = await db.collection('workshops').findOne({ _id: new ObjectId(existingParticipant.workshopId) })
      if (!workshop || workshop.conductedBy !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Remove _id from update data
    const { _id, ...updateData } = participantData

    const result = await db.collection('participants').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update participant error:', error)
    return NextResponse.json({ error: 'Failed to update participant' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()

    // Get the existing participant to check permissions
    const existingParticipant = await db.collection('participants').findOne({ _id: new ObjectId(params.id) })
    if (!existingParticipant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    // Check if user has permission (admin or workshop conductor)
    if (session.user.role !== 'admin') {
      const workshop = await db.collection('workshops').findOne({ _id: new ObjectId(existingParticipant.workshopId) })
      if (!workshop || workshop.conductedBy !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const result = await db.collection('participants').deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete participant error:', error)
    return NextResponse.json({ error: 'Failed to delete participant' }, { status: 500 })
  }
}