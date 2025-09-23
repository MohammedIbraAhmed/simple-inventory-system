/**
 * Utility functions for workshop management
 */

/**
 * Generates a unique workshop code based on user initials, date, and location
 * Format: [UserInitials]-[YYYYMMDD]-[LocationCode]-[Counter]
 * Example: AH-20250923-GE-001
 */
export function generateWorkshopCode(
  userName: string,
  date: string, // YYYY-MM-DD format
  locationName: string,
  counter: number = 1
): string {
  // Extract user initials (first letter of each word, max 3 letters)
  const initials = userName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .slice(0, 3) // Max 3 initials
    .join('')

  // Format date as YYYYMMDD
  const formattedDate = date.replace(/-/g, '')

  // Generate location code (first 2 letters of each word, max 4 letters)
  const locationCode = locationName
    .split(' ')
    .map(word => word.substring(0, 2).toUpperCase())
    .join('')
    .substring(0, 4) // Max 4 characters

  // Format counter with leading zeros (3 digits)
  const formattedCounter = counter.toString().padStart(3, '0')

  return `${initials}-${formattedDate}-${locationCode}-${formattedCounter}`
}

/**
 * Extracts location name from location object or returns default
 */
export function getLocationDisplayName(location: any): string {
  if (location?.name) {
    return location.name
  }
  if (location?.neighborhood && location?.governorate) {
    return `${location.neighborhood}, ${location.governorate}`
  }
  return 'Unknown Location'
}

/**
 * Generates a unique workshop code by checking existing codes in database
 */
export async function generateUniqueWorkshopCode(
  userName: string,
  date: string,
  locationName: string,
  existingCodes: string[]
): Promise<string> {
  let counter = 1
  let code = generateWorkshopCode(userName, date, locationName, counter)

  // Keep incrementing counter until we find a unique code
  while (existingCodes.includes(code)) {
    counter++
    code = generateWorkshopCode(userName, date, locationName, counter)
  }

  return code
}

/**
 * Validates workshop code format
 */
export function isValidWorkshopCode(code: string): boolean {
  // Format: [1-3 letters]-[8 digits]-[1-4 letters]-[3 digits]
  const pattern = /^[A-Z]{1,3}-\d{8}-[A-Z]{1,4}-\d{3}$/
  return pattern.test(code)
}

/**
 * Parses workshop code to extract components
 */
export function parseWorkshopCode(code: string): {
  initials: string
  date: string
  locationCode: string
  counter: number
} | null {
  if (!isValidWorkshopCode(code)) {
    return null
  }

  const parts = code.split('-')
  return {
    initials: parts[0],
    date: parts[1],
    locationCode: parts[2],
    counter: parseInt(parts[3], 10)
  }
}

// ============================================================================
// PROGRAM MANAGEMENT UTILITIES
// ============================================================================

/**
 * Generates a unique program code based on user initials, start date, and location
 * Format: [UserInitials]-[YYYYMMDD]-[LocationCode]-PROG-[Counter]
 * Example: AH-20250923-GZCE-PROG-001
 */
export function generateProgramCode(
  userName: string,
  startDate: string, // YYYY-MM-DD format
  locationName: string,
  counter: number = 1
): string {
  // Extract user initials (first letter of each word, max 3 letters)
  const initials = userName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .slice(0, 3) // Max 3 initials
    .join('')

  // Format date as YYYYMMDD
  const formattedDate = startDate.replace(/-/g, '')

  // Generate location code (first 2 letters of each word, max 4 letters)
  const locationCode = locationName
    .split(' ')
    .map(word => word.substring(0, 2).toUpperCase())
    .join('')
    .substring(0, 4) // Max 4 characters

  // Format counter with leading zeros (3 digits)
  const formattedCounter = counter.toString().padStart(3, '0')

  return `${initials}-${formattedDate}-${locationCode}-PROG-${formattedCounter}`
}

/**
 * Generates a unique program code by checking existing codes in database
 */
export async function generateUniqueProgramCode(
  userName: string,
  startDate: string,
  locationName: string,
  existingCodes: string[]
): Promise<string> {
  let counter = 1
  let code = generateProgramCode(userName, startDate, locationName, counter)

  // Keep incrementing counter until we find a unique code
  while (existingCodes.includes(code)) {
    counter++
    code = generateProgramCode(userName, startDate, locationName, counter)
  }

  return code
}

/**
 * Generates a session code based on program code and session number
 * Format: [ProgramCode]-S[SessionNumber]
 * Example: AH-20250923-GZCE-PROG-001-S01
 */
export function generateSessionCode(
  programCode: string,
  sessionNumber: number
): string {
  const formattedSessionNumber = sessionNumber.toString().padStart(2, '0')
  return `${programCode}-S${formattedSessionNumber}`
}

/**
 * Validates program code format
 */
export function isValidProgramCode(code: string): boolean {
  // Format: [1-3 letters]-[8 digits]-[1-4 letters]-PROG-[3 digits]
  const pattern = /^[A-Z]{1,3}-\d{8}-[A-Z]{1,4}-PROG-\d{3}$/
  return pattern.test(code)
}

/**
 * Validates session code format
 */
export function isValidSessionCode(code: string): boolean {
  // Format: [1-3 letters]-[8 digits]-[1-4 letters]-PROG-[3 digits]-S[2 digits]
  const pattern = /^[A-Z]{1,3}-\d{8}-[A-Z]{1,4}-PROG-\d{3}-S\d{2}$/
  return pattern.test(code)
}

/**
 * Parses program code to extract components
 */
export function parseProgramCode(code: string): {
  initials: string
  date: string
  locationCode: string
  counter: number
} | null {
  if (!isValidProgramCode(code)) {
    return null
  }

  const parts = code.split('-')
  return {
    initials: parts[0],
    date: parts[1],
    locationCode: parts[2],
    // parts[3] is "PROG"
    counter: parseInt(parts[4], 10)
  }
}

/**
 * Parses session code to extract components
 */
export function parseSessionCode(code: string): {
  programCode: string
  sessionNumber: number
  initials: string
  date: string
  locationCode: string
  programCounter: number
} | null {
  if (!isValidSessionCode(code)) {
    return null
  }

  const parts = code.split('-')
  const programCode = parts.slice(0, 5).join('-') // Everything except the session part
  const sessionPart = parts[5] // "S01", "S02", etc.
  const sessionNumber = parseInt(sessionPart.substring(1), 10)

  return {
    programCode,
    sessionNumber,
    initials: parts[0],
    date: parts[1],
    locationCode: parts[2],
    programCounter: parseInt(parts[4], 10)
  }
}

/**
 * Extracts program code from session code
 */
export function getProgramCodeFromSession(sessionCode: string): string | null {
  const parsed = parseSessionCode(sessionCode)
  return parsed ? parsed.programCode : null
}

/**
 * Calculates program progress percentage
 */
export function calculateProgramProgress(
  completedSessions: number,
  totalSessions: number
): number {
  if (totalSessions === 0) return 0
  return Math.round((completedSessions / totalSessions) * 100)
}

/**
 * Determines if participant has completed the program based on attendance
 */
export function hasCompletedProgram(
  sessionsAttended: number,
  minimumSessionsRequired: number
): boolean {
  return sessionsAttended >= minimumSessionsRequired
}

/**
 * Calculates attendance rate for a participant in a program
 */
export function calculateAttendanceRate(
  sessionsAttended: number,
  totalSessionsHeld: number
): number {
  if (totalSessionsHeld === 0) return 0
  return Math.round((sessionsAttended / totalSessionsHeld) * 100)
}

/**
 * Generates program duration display string
 */
export function formatProgramDuration(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays <= 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'}`
  } else if (diffDays <= 30) {
    const weeks = Math.round(diffDays / 7)
    return `${weeks} week${weeks === 1 ? '' : 's'}`
  } else {
    const months = Math.round(diffDays / 30)
    return `${months} month${months === 1 ? '' : 's'}`
  }
}