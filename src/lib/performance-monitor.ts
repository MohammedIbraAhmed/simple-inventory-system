/**
 * Performance Monitoring Utility
 * Tracks API performance, database queries, and frontend metrics
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  labels?: Record<string, string>
}

interface APIMetric extends PerformanceMetric {
  method: string
  endpoint: string
  statusCode: number
  responseTime: number
  cacheHit?: boolean
}

interface DatabaseMetric extends PerformanceMetric {
  collection: string
  operation: string
  documents?: number
  queryTime: number
  useIndex?: boolean
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private readonly maxMetrics = 10000
  private apiMetrics: APIMetric[] = []
  private dbMetrics: DatabaseMetric[] = []

  /**
   * Record API performance metric
   */
  recordAPI(metric: Omit<APIMetric, 'timestamp' | 'name' | 'value'>) {
    const apiMetric: APIMetric = {
      ...metric,
      name: 'api_request',
      value: metric.responseTime,
      timestamp: Date.now()
    }

    this.apiMetrics.push(apiMetric)
    this.metrics.push(apiMetric)
    this.cleanup()

    // Log slow requests
    if (metric.responseTime > 2000) {
      console.warn(`🐌 Slow API request: ${metric.method} ${metric.endpoint} - ${metric.responseTime}ms`)
    }

    // Log cache performance
    if (metric.cacheHit) {
      console.log(`🎯 Cache hit: ${metric.method} ${metric.endpoint} - ${metric.responseTime}ms`)
    }
  }

  /**
   * Record database performance metric
   */
  recordDatabase(metric: Omit<DatabaseMetric, 'timestamp' | 'name' | 'value'>) {
    const dbMetric: DatabaseMetric = {
      ...metric,
      name: 'db_query',
      value: metric.queryTime,
      timestamp: Date.now()
    }

    this.dbMetrics.push(dbMetric)
    this.metrics.push(dbMetric)
    this.cleanup()

    // Log slow queries
    if (metric.queryTime > 1000) {
      console.warn(`🐌 Slow DB query: ${metric.collection}.${metric.operation} - ${metric.queryTime}ms`)
    }

    // Log queries without indexes
    if (metric.useIndex === false) {
      console.warn(`📊 Query without index: ${metric.collection}.${metric.operation}`)
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const now = Date.now()
    const last5Min = now - 5 * 60 * 1000
    const last1Hour = now - 60 * 60 * 1000

    const recentAPI = this.apiMetrics.filter(m => m.timestamp > last5Min)
    const recentDB = this.dbMetrics.filter(m => m.timestamp > last5Min)

    const hourlyAPI = this.apiMetrics.filter(m => m.timestamp > last1Hour)
    const hourlyDB = this.dbMetrics.filter(m => m.timestamp > last1Hour)

    return {
      summary: {
        totalRequests: this.apiMetrics.length,
        totalDBQueries: this.dbMetrics.length,
        uptime: process.uptime()
      },
      recent: {
        apiRequests: recentAPI.length,
        dbQueries: recentDB.length,
        avgResponseTime: this.average(recentAPI.map(m => m.responseTime)),
        avgQueryTime: this.average(recentDB.map(m => m.queryTime)),
        cacheHitRate: this.cacheHitRate(recentAPI),
        slowRequests: recentAPI.filter(m => m.responseTime > 2000).length,
        slowQueries: recentDB.filter(m => m.queryTime > 1000).length
      },
      hourly: {
        apiRequests: hourlyAPI.length,
        dbQueries: hourlyDB.length,
        avgResponseTime: this.average(hourlyAPI.map(m => m.responseTime)),
        avgQueryTime: this.average(hourlyDB.map(m => m.queryTime)),
        cacheHitRate: this.cacheHitRate(hourlyAPI),
        slowRequests: hourlyAPI.filter(m => m.responseTime > 2000).length,
        slowQueries: hourlyDB.filter(m => m.queryTime > 1000).length
      },
      endpoints: this.getEndpointStats(hourlyAPI),
      collections: this.getCollectionStats(hourlyDB),
      memory: process.memoryUsage()
    }
  }

  /**
   * Get endpoint-specific statistics
   */
  private getEndpointStats(metrics: APIMetric[]) {
    const endpointStats = new Map<string, {
      count: number
      totalTime: number
      avgTime: number
      slowCount: number
      cacheHits: number
    }>()

    metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`
      const existing = endpointStats.get(key) || {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        slowCount: 0,
        cacheHits: 0
      }

      existing.count++
      existing.totalTime += metric.responseTime
      existing.avgTime = existing.totalTime / existing.count
      if (metric.responseTime > 2000) existing.slowCount++
      if (metric.cacheHit) existing.cacheHits++

      endpointStats.set(key, existing)
    })

    return Object.fromEntries(endpointStats)
  }

  /**
   * Get collection-specific statistics
   */
  private getCollectionStats(metrics: DatabaseMetric[]) {
    const collectionStats = new Map<string, {
      count: number
      totalTime: number
      avgTime: number
      slowCount: number
      noIndexCount: number
    }>()

    metrics.forEach(metric => {
      const key = metric.collection
      const existing = collectionStats.get(key) || {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        slowCount: 0,
        noIndexCount: 0
      }

      existing.count++
      existing.totalTime += metric.queryTime
      existing.avgTime = existing.totalTime / existing.count
      if (metric.queryTime > 1000) existing.slowCount++
      if (metric.useIndex === false) existing.noIndexCount++

      collectionStats.set(key, existing)
    })

    return Object.fromEntries(collectionStats)
  }

  /**
   * Calculate average
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  /**
   * Calculate cache hit rate
   */
  private cacheHitRate(metrics: APIMetric[]): number {
    if (metrics.length === 0) return 0
    const hits = metrics.filter(m => m.cacheHit).length
    return (hits / metrics.length) * 100
  }

  /**
   * Clean up old metrics
   */
  private cleanup() {
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    if (this.apiMetrics.length > this.maxMetrics) {
      this.apiMetrics = this.apiMetrics.slice(-this.maxMetrics)
    }

    if (this.dbMetrics.length > this.maxMetrics) {
      this.dbMetrics = this.dbMetrics.slice(-this.maxMetrics)
    }
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(format: 'json' | 'prometheus' = 'json') {
    if (format === 'prometheus') {
      return this.toPrometheusFormat()
    }
    return JSON.stringify(this.getStats(), null, 2)
  }

  /**
   * Convert metrics to Prometheus format
   */
  private toPrometheusFormat(): string {
    const stats = this.getStats()
    const lines: string[] = []

    // API metrics
    lines.push('# HELP api_response_time_ms API response time in milliseconds')
    lines.push('# TYPE api_response_time_ms histogram')
    lines.push(`api_response_time_ms_sum ${stats.hourly.avgResponseTime * stats.hourly.apiRequests}`)
    lines.push(`api_response_time_ms_count ${stats.hourly.apiRequests}`)

    // Database metrics
    lines.push('# HELP db_query_time_ms Database query time in milliseconds')
    lines.push('# TYPE db_query_time_ms histogram')
    lines.push(`db_query_time_ms_sum ${stats.hourly.avgQueryTime * stats.hourly.dbQueries}`)
    lines.push(`db_query_time_ms_count ${stats.hourly.dbQueries}`)

    // Cache hit rate
    lines.push('# HELP cache_hit_rate_percent Cache hit rate percentage')
    lines.push('# TYPE cache_hit_rate_percent gauge')
    lines.push(`cache_hit_rate_percent ${stats.hourly.cacheHitRate}`)

    return lines.join('\n')
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = []
    this.apiMetrics = []
    this.dbMetrics = []
  }
}

// Global monitor instance
const monitor = new PerformanceMonitor()

/**
 * API middleware for automatic performance tracking
 */
export function withPerformanceTracking(
  handler: Function,
  endpoint: string
) {
  return async function(request: any, ...args: any[]) {
    const startTime = Date.now()
    const method = request.method || 'GET'

    try {
      const response = await handler(request, ...args)
      const responseTime = Date.now() - startTime

      monitor.recordAPI({
        method,
        endpoint,
        statusCode: response.status || 200,
        responseTime,
        cacheHit: response.headers?.get('x-cache-hit') === 'true'
      })

      return response
    } catch (error) {
      const responseTime = Date.now() - startTime

      monitor.recordAPI({
        method,
        endpoint,
        statusCode: 500,
        responseTime
      })

      throw error
    }
  }
}

/**
 * Database middleware for automatic query tracking
 */
export function withDatabaseTracking<T>(
  query: () => Promise<T>,
  collection: string,
  operation: string,
  options?: { useIndex?: boolean; documents?: number }
): Promise<T> {
  const startTime = Date.now()

  return query().then(result => {
    const queryTime = Date.now() - startTime

    monitor.recordDatabase({
      collection,
      operation,
      queryTime,
      useIndex: options?.useIndex,
      documents: options?.documents
    })

    return result
  }).catch(error => {
    const queryTime = Date.now() - startTime

    monitor.recordDatabase({
      collection,
      operation,
      queryTime,
      useIndex: false // Assume failed queries don't use indexes efficiently
    })

    throw error
  })
}

/**
 * Performance monitoring utilities
 */
export const performanceUtils = {
  /**
   * Get current performance stats
   */
  getStats: () => monitor.getStats(),

  /**
   * Export metrics
   */
  exportMetrics: (format?: 'json' | 'prometheus') => monitor.exportMetrics(format),

  /**
   * Reset metrics
   */
  reset: () => monitor.reset(),

  /**
   * Health check
   */
  healthCheck: () => {
    const stats = monitor.getStats()
    const isHealthy = {
      api: stats.recent.avgResponseTime < 3000,
      database: stats.recent.avgQueryTime < 2000,
      memory: (stats.memory.heapUsed / stats.memory.heapTotal) < 0.8,
      cache: stats.recent.cacheHitRate > 20
    }

    return {
      healthy: Object.values(isHealthy).every(Boolean),
      checks: isHealthy,
      stats: stats.recent
    }
  }
}

export { monitor }
export default monitor