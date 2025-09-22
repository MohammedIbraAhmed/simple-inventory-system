import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { authConfig } from '@/lib/auth-config'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()

    // Fetch all workshops with conductor information
    const workshops = await db.collection('workshops').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'conductedBy',
          foreignField: '_id',
          as: 'conductor'
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          date: 1,
          startTime: 1,
          endTime: 1,
          location: 1,
          status: 1,
          expectedParticipants: 1,
          actualParticipants: 1,
          conductorName: { $arrayElemAt: ['$conductor.name', 0] },
          createdAt: 1,
          notes: 1
        }
      }
    ]).toArray()

    // Transform data for export
    const exportData = workshops.map(workshop => ({
      title: workshop.title,
      description: workshop.description || '',
      date: workshop.date,
      startTime: workshop.startTime,
      endTime: workshop.endTime,
      location: workshop.location,
      status: workshop.status,
      expectedParticipants: workshop.expectedParticipants,
      actualParticipants: workshop.actualParticipants,
      conductorName: workshop.conductorName || '',
      createdAt: workshop.createdAt,
      notes: workshop.notes || ''
    }))

    return NextResponse.json({
      data: exportData,
      count: exportData.length,
      exportedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    )
  }
}