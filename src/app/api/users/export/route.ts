import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { authConfig } from '@/lib/auth-config'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()

    // Fetch all users (excluding sensitive information)
    const users = await db.collection('users').find({}).toArray()

    // Transform data for export (exclude password and other sensitive fields)
    const exportData = users.map(user => ({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      organization: user.profile?.organization || '',
      phone: user.profile?.phone || '',
      location: user.profile?.location || '',
      createdAt: user.createdAt,
      lastLogin: user.lastLogin || ''
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