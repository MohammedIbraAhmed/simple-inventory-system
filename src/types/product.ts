export interface Product {
  _id?: string
  name: string
  sku: string
  stock: number
  price: number
  category: 'materials' | 'refreshments'
  notes?: string
}

export interface Location {
  _id?: string
  name: string
  type: string
  governorate: string
  neighborhood: string
  gpsCoordinates: {
    latitude: number
    longitude: number
  }
  siteManager: {
    name: string
    phoneNumber: string
  }
  demographics: {
    numberOfPeople: number
    numberOfChildren: number
  }
  region: 'Gaza Strip'
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export interface LocationRequest {
  _id?: string
  requestType: 'create' | 'edit' | 'delete'
  locationData: Omit<Location, '_id' | 'createdAt' | 'updatedAt'>
  originalLocationId?: string // For edit/delete requests
  requestedBy: string // User ID who made the request
  requestedByName: string // User name for display
  status: 'pending' | 'approved' | 'rejected'
  adminNotes?: string
  createdAt: string
  updatedAt: string
  reviewedBy?: string // Admin ID who reviewed
  reviewedByName?: string // Admin name for display
  reviewedAt?: string
}

export interface Workshop {
  _id?: string
  workshopCode?: string // Auto-generated unique code
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  locationId: string
  locationName?: string // Populated field for display
  locationNeighborhood?: string // Populated field for display
  conductedBy: string // user ID who created it
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled'
  expectedParticipants: number
  actualParticipants: number
  materialsUsed: {
    productId: string
    productName: string
    quantity: number
    distributedTo: string[] // participant IDs
  }[]
  createdAt: string
  notes?: string
}

// Program Management - Multi-session activities
export interface Program {
  _id?: string
  programCode?: string // Auto-generated unique code: [UserInitials]-[YYYYMMDD]-[LocationCode]-PROG-[Counter]
  title: string
  description: string
  objectives: string[] // Program learning objectives
  startDate: string
  endDate: string
  totalSessions: number
  minimumSessionsForCompletion: number // Required sessions to "complete" the program
  locationId: string
  locationName?: string // Populated field for display
  locationNeighborhood?: string // Populated field for display
  conductedBy: string // user ID who created it
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled'
  expectedParticipants: number
  enrolledParticipants: number
  completedParticipants: number // Participants who met completion criteria
  category: string // e.g., "Education", "Health", "Vocational Training"
  targetAgeGroup: {
    minAge: number
    maxAge: number
  }
  materials: {
    productId: string
    productName: string
    quantityPerParticipant: number
    distributionSession?: number // Which session to distribute (optional)
  }[]
  createdAt: string
  updatedAt: string
  notes?: string
}

export interface Session {
  _id?: string
  sessionCode?: string // Auto-generated: [ProgramCode]-S[SessionNumber]
  programId: string // Link to parent program
  sessionNumber: number // 1, 2, 3, etc.
  title: string
  description: string
  objectives: string[] // Session-specific objectives
  date: string
  startTime: string
  endTime: string
  locationId: string // Can override program location if needed
  locationName?: string // Populated field for display
  locationNeighborhood?: string // Populated field for display
  conductedBy: string // user ID who conducted this session
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled'
  expectedParticipants: number
  actualParticipants: number
  attendanceRate: number // Calculated field
  materialsUsed: {
    productId: string
    productName: string
    quantity: number
    distributedTo: string[] // programParticipant IDs
  }[]
  sessionOutcomes?: string // What was achieved in this session
  createdAt: string
  updatedAt: string
  notes?: string
}

export interface ProgramParticipant {
  _id?: string
  programId: string
  participantId: string // Reference to unique participant record
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  idNumber: string // National ID or identification number
  phoneNumber: string
  specialStatus: {
    isDisabled: boolean
    isWounded: boolean
    isSeparated: boolean
    isUnaccompanied: boolean
  }
  enrollmentDate: string
  status: 'enrolled' | 'active' | 'completed' | 'dropped-out' | 'transferred'
  completionDate?: string
  sessionsAttended: number
  sessionsCompleted: number // Sessions where they were marked as completed/passed
  attendanceRate: number // Calculated field
  overallMaterialsReceived: {
    productId: string
    productName: string
    totalQuantity: number
    sessionsReceived: number[] // Which sessions they received materials
  }[]
  programOutcome?: 'completed' | 'partially-completed' | 'not-completed'
  notes?: string
}

export interface SessionAttendance {
  _id?: string
  sessionId: string
  programParticipantId: string
  participantName: string // For quick reference
  attendanceStatus: 'registered' | 'attended' | 'absent' | 'late' | 'left-early'
  checkInTime?: string
  checkOutTime?: string
  sessionMaterialsReceived: {
    productId: string
    productName: string
    quantity: number
    receivedAt: string
  }[]
  sessionPerformance?: 'excellent' | 'good' | 'satisfactory' | 'needs-improvement'
  sessionNotes?: string // Individual notes for this participant in this session
  recordedBy: string // User ID who recorded attendance
  recordedAt: string
}

export interface Distribution {
  _id?: string
  type: 'beneficiary' | 'workshop' | 'emergency'
  productId: string
  productName: string
  quantity: number
  recipient: string // beneficiary name or workshop title
  distributedBy: string
  date: string
  notes?: string
}

export interface User {
  _id?: string
  name: string
  email: string
  role: 'admin' | 'user'
  isActive: boolean
  createdAt: string
  profile: {
    organization?: string
    phone?: string
    location?: string
  }
}

export interface UserBalance {
  _id?: string
  userId: string
  productId: string
  productName: string
  allocatedQuantity: number
  availableQuantity: number
  lastUpdated: string
}

export interface StockTransaction {
  _id?: string
  fromUserId: string
  toUserId: string
  productId: string
  productName: string
  quantity: number
  type: 'allocation' | 'return'
  timestamp: string
  notes?: string
}

export interface Participant {
  _id?: string
  workshopId: string
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  idNumber: string // National ID or identification number
  phoneNumber: string
  specialStatus: {
    isDisabled: boolean
    isWounded: boolean
    isSeparated: boolean
    isUnaccompanied: boolean
  }
  registrationDate: string
  attendanceStatus: 'registered' | 'attended' | 'no-show'
  materialsReceived: {
    productId: string
    productName: string
    quantity: number
    receivedAt: string
  }[]
}