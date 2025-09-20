import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/types/product'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const users = await db.collection('users').find({}).toArray()
    return NextResponse.json(users)
  } catch (error) {
    console.error('Fetch users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await connectDB()
    const userData: Partial<User> = await request.json()

    // Validate required fields
    if (!userData.name || !userData.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await db.collection('users').findOne({ email: userData.email })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    const newUser = {
      name: userData.name,
      email: userData.email,
      role: userData.role || 'user',
      isActive: true,
      createdAt: new Date().toISOString(),
      profile: {
        organization: userData.profile?.organization || '',
        phone: userData.profile?.phone || '',
        location: userData.profile?.location || ''
      }
    }

    const result = await db.collection('users').insertOne(newUser)
    return NextResponse.json({ _id: result.insertedId, ...newUser })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}