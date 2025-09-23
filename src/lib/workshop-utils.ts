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