import { createHealthCheckResponse } from '@/lib/db-error-handler'

export async function GET() {
  return await createHealthCheckResponse()
}