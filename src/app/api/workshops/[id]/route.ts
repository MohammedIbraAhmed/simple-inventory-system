import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { ObjectId } from 'mongodb'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await connectDB()
    const workshop = await request.json()

    // Remove _id from update data to avoid conflicts
    const { _id, ...updateData } = workshop

    // Validate required fields
    if (!updateData.title || !updateData.date) {
      return NextResponse.json({ error: 'Title and date are required' }, { status: 400 })
    }

    // Ensure numeric fields are numbers
    updateData.participants = Number(updateData.participants) || 0

    const result = await db.collection('workshops').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Failed to update workshop' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await connectDB()
    const result = await db.collection('workshops').deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete workshop' }, { status: 500 })
  }
}