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