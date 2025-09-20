import { z } from 'zod'

// Product validation schema
export const ProductSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, 'Product name is required').max(100, 'Product name too long'),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  price: z.number().min(0, 'Price cannot be negative'),
  category: z.enum(['materials', 'refreshments'], {
    errorMap: () => ({ message: 'Category must be either materials or refreshments' })
  }),
  notes: z.string().max(500, 'Notes too long').optional()
})

// Workshop validation schema
export const WorkshopSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1, 'Workshop title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  location: z.string().min(1, 'Location is required').max(200, 'Location too long'),
  conductedBy: z.string().min(1, 'Conductor ID is required'),
  status: z.enum(['planned', 'ongoing', 'completed', 'cancelled']),
  expectedParticipants: z.number().int().min(0, 'Expected participants cannot be negative'),
  actualParticipants: z.number().int().min(0, 'Actual participants cannot be negative'),
  materialsUsed: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    productName: z.string().min(1, 'Product name is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    distributedTo: z.array(z.string())
  })),
  createdAt: z.string(),
  notes: z.string().max(500, 'Notes too long').optional()
})

// User validation schema
export const UserSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'user']),
  isActive: z.boolean(),
  createdAt: z.string(),
  profile: z.object({
    organization: z.string().max(200, 'Organization name too long').optional(),
    phone: z.string().max(20, 'Phone number too long').optional(),
    location: z.string().max(200, 'Location too long').optional()
  })
})

// User Balance validation schema
export const UserBalanceSchema = z.object({
  _id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  productName: z.string().min(1, 'Product name is required'),
  allocatedQuantity: z.number().int().min(0, 'Allocated quantity cannot be negative'),
  availableQuantity: z.number().int().min(0, 'Available quantity cannot be negative'),
  lastUpdated: z.string()
})

// Participant validation schema
export const ParticipantSchema = z.object({
  _id: z.string().optional(),
  workshopId: z.string().min(1, 'Workshop ID is required'),
  name: z.string().min(1, 'Participant name is required').max(100, 'Name too long'),
  age: z.number().int().min(0, 'Age cannot be negative').max(150, 'Invalid age'),
  phoneNumber: z.string().min(1, 'Phone number is required').max(20, 'Phone number too long'),
  specialStatus: z.object({
    isDisabled: z.boolean(),
    isWounded: z.boolean(),
    isSeparated: z.boolean(),
    isUnaccompanied: z.boolean()
  }),
  registrationDate: z.string(),
  attendanceStatus: z.enum(['registered', 'attended', 'no-show']),
  materialsReceived: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    productName: z.string().min(1, 'Product name is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    receivedAt: z.string()
  }))
})

// Distribution validation schema
export const DistributionSchema = z.object({
  _id: z.string().optional(),
  type: z.enum(['beneficiary', 'workshop', 'emergency']),
  productId: z.string().min(1, 'Product ID is required'),
  productName: z.string().min(1, 'Product name is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  recipient: z.string().min(1, 'Recipient is required').max(200, 'Recipient name too long'),
  distributedBy: z.string().min(1, 'Distributor ID is required'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().max(500, 'Notes too long').optional()
})

// Stock Transaction validation schema
export const StockTransactionSchema = z.object({
  _id: z.string().optional(),
  fromUserId: z.string().min(1, 'From user ID is required'),
  toUserId: z.string().min(1, 'To user ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  productName: z.string().min(1, 'Product name is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  type: z.enum(['allocation', 'return']),
  timestamp: z.string(),
  notes: z.string().max(500, 'Notes too long').optional()
})

// Auth validation schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

export const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  organization: z.string().max(200, 'Organization name too long').optional(),
  phone: z.string().max(20, 'Phone number too long').optional(),
  location: z.string().max(200, 'Location too long').optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Helper function to validate data against schema
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: string[]
} {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return {
      success: false,
      errors: ['Unknown validation error']
    }
  }
}