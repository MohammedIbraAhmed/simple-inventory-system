import { NextRequest, NextResponse } from 'next/server'
import { createAuthHandler, AuthSession } from '@/lib/auth-middleware'
import { performanceUtils } from '@/lib/performance-monitor'
import { cacheUtils } from '@/lib/cache'

async function handleGetPerformance(request: NextRequest, session: AuthSession) {
  try {
    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'json'
    const action = url.searchParams.get('action')

    // Handle different actions
    switch (action) {
      case 'health':
        return NextResponse.json(performanceUtils.healthCheck())

      case 'cache':
        return NextResponse.json(cacheUtils.getStats())

      case 'reset':
        performanceUtils.reset()
        cacheUtils.clear()
        return NextResponse.json({ message: 'Performance metrics and cache cleared' })

      case 'export':
        const metrics = performanceUtils.exportMetrics(format as 'json' | 'prometheus')

        if (format === 'prometheus') {
          return new NextResponse(metrics, {
            headers: {
              'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
            },
          })
        }

        return new NextResponse(metrics, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="performance-metrics-${Date.now()}.json"`,
          },
        })

      default:
        // Default: return full performance stats
        const stats = performanceUtils.getStats()
        const cacheStats = cacheUtils.getStats()

        return NextResponse.json({
          performance: stats,
          cache: cacheStats,
          timestamp: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('Performance endpoint error:', error)
    return NextResponse.json({ error: 'Failed to get performance data' }, { status: 500 })
  }
}

async function handlePerformanceActions(request: NextRequest, session: AuthSession) {
  try {
    const { action, target } = await request.json()

    switch (action) {
      case 'clear_cache':
        if (target) {
          cacheUtils.invalidatePattern(target)
          return NextResponse.json({ message: `Cache cleared for pattern: ${target}` })
        } else {
          cacheUtils.clear()
          return NextResponse.json({ message: 'All cache cleared' })
        }

      case 'reset_metrics':
        performanceUtils.reset()
        return NextResponse.json({ message: 'Performance metrics reset' })

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Performance action error:', error)
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 })
  }
}

// Admin-only access for performance monitoring
export const GET = createAuthHandler(handleGetPerformance, 'admin')
export const POST = createAuthHandler(handlePerformanceActions, 'admin')