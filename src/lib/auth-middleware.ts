import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth-config'

export interface AuthSession {
  user: {
    id: string
    email: string
    name: string
    role: 'admin' | 'user'
  }
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getServerSession(authOptions) as AuthSession | null
  if (!session) {
    throw new Error('Authentication required')
  }
  return session
}

export async function requireAdmin(): Promise<AuthSession> {
  const session = await requireAuth()
  if (session.user.role !== 'admin') {
    throw new Error('Admin access required')
  }
  return session
}

export async function requireUserOrAdmin(): Promise<AuthSession> {
  const session = await requireAuth()
  if (!['admin', 'user'].includes(session.user.role)) {
    throw new Error('User or admin access required')
  }
  return session
}

export function createAuthHandler(
  handler: (request: NextRequest, session: AuthSession, params?: any) => Promise<NextResponse>,
  requireRole?: 'admin' | 'user' | 'any'
) {
  return async function(request: NextRequest, context?: { params: any }) {
    try {
      let session: AuthSession

      switch (requireRole) {
        case 'admin':
          session = await requireAdmin()
          break
        case 'user':
          session = await requireUserOrAdmin()
          break
        case 'any':
        default:
          session = await requireAuth()
          break
      }

      return await handler(request, session, context?.params)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Access denied'

      if (errorMessage === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      } else if (errorMessage === 'Admin access required') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      } else {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }
  }
}

export async function checkResourceOwnership(
  session: AuthSession,
  resourceUserId: string,
  adminCanAccess: boolean = true
): Promise<boolean> {
  // Admin can access everything if adminCanAccess is true
  if (adminCanAccess && session.user.role === 'admin') {
    return true
  }

  // User can only access their own resources
  return session.user.id === resourceUserId
}

export async function checkWorkshopPermission(
  session: AuthSession,
  workshopConductorId: string
): Promise<boolean> {
  // Admin can access all workshops
  if (session.user.role === 'admin') {
    return true
  }

  // Regular users can only access workshops they conduct
  return session.user.id === workshopConductorId
}