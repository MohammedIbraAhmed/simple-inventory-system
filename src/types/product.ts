export interface Product {
  _id?: string
  name: string
  sku: string
  stock: number
  price: number
  category: 'materials' | 'refreshments'
  notes?: string
}

export interface Workshop {
  _id?: string
  title: string
  date: string
  participants: number
  status: 'planned' | 'completed'
  refreshmentsUsed?: {
    productId: string
    quantity: number
  }[]
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