import { 
  db, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  httpsCallable,
  functions,
  type DocumentData 
} from '@/lib/firebase'

export interface Order {
  id?: string
  user_id?: string
  guest_session_id?: string
  guest_email?: string
  guest_phone?: string
  guest_name?: string
  guest_tpin?: string
  order_number: string
  items: OrderItem[]
  shipping_address: Address
  billing_address?: Address
  total_amount: number
  payment_method: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  created_at?: any
  updated_at?: any
}

export interface OrderItem {
  product_id: string
  article_id: string
  name: string
  quantity: number
  price: number
  size?: string
  color?: string
}

export interface Address {
  name: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  pincode: string
  country?: string
}

export interface GuestSession {
  guest_session_id: string
  email: string
  name: string
  phone?: string
  expires_at?: any
  created_at?: any
}

export interface GuestOrderMergeResult {
  success: boolean
  merged_orders_count: number
  total_merged_amount: number
  error?: string
}

class OrderService {
  private static instance: OrderService

  static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService()
    }
    return OrderService.instance
  }

  // Create new order
  async createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const orderRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      })
      
      return orderRef.id
    } catch (error: any) {
      console.error('Error creating order:', error)
      throw new Error(error.message || 'Failed to create order')
    }
  }

  // Get order by ID
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const orderRef = doc(db, 'orders', orderId)
      const orderSnap = await getDoc(orderRef)
      
      if (orderSnap.exists()) {
        return { id: orderSnap.id, ...orderSnap.data() } as Order
      }
      return null
    } catch (error: any) {
      console.error('Error getting order:', error)
      throw new Error(error.message || 'Failed to get order')
    }
  }

  // Get orders by user ID
  async getUserOrders(userId: string, limitCount = 20): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      )
      
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]
    } catch (error: any) {
      console.error('Error getting user orders:', error)
      throw new Error(error.message || 'Failed to get user orders')
    }
  }

  // Get orders by guest session ID
  async getGuestOrders(guestSessionId: string, limitCount = 20): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('guest_session_id', '==', guestSessionId),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      )
      
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]
    } catch (error: any) {
      console.error('Error getting guest orders:', error)
      throw new Error(error.message || 'Failed to get guest orders')
    }
  }

  // Get guest orders by email/phone/tpin
  async getGuestOrdersByContact(email: string, phone: string, tpin?: string): Promise<Order[]> {
    try {
      let q = query(
        collection(db, 'orders'),
        orderBy('created_at', 'desc')
      )

      // Build the OR condition for email or phone
      const conditions = []
      if (email) conditions.push(where('guest_email', '==', email))
      if (phone) conditions.push(where('guest_phone', '==', phone))
      if (tpin) conditions.push(where('guest_tpin', '==', tpin))

      // For now, we'll do multiple queries since Firestore doesn't support multiple OR conditions well
      const orders: Order[] = []
      
      if (email) {
        const emailQuery = query(
          collection(db, 'orders'),
          where('guest_email', '==', email),
          orderBy('created_at', 'desc')
        )
        const emailSnapshot = await getDocs(emailQuery)
        orders.push(...emailSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[])
      }
      
      if (phone) {
        const phoneQuery = query(
          collection(db, 'orders'),
          where('guest_phone', '==', phone),
          orderBy('created_at', 'desc')
        )
        const phoneSnapshot = await getDocs(phoneQuery)
        orders.push(...phoneSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[])
      }

      // Remove duplicates and filter by tpin if provided
      const uniqueOrders = orders.filter((order, index, self) => 
        index === self.findIndex(o => o.id === order.id)
      )

      if (tpin) {
        return uniqueOrders.filter(order => order.guest_tpin === tpin)
      }

      return uniqueOrders
    } catch (error: any) {
      console.error('Error getting guest orders by contact:', error)
      throw new Error(error.message || 'Failed to get guest orders')
    }
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: Order['order_status']): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', orderId)
      await updateDoc(orderRef, {
        order_status: status,
        updated_at: serverTimestamp()
      })
    } catch (error: any) {
      console.error('Error updating order status:', error)
      throw new Error(error.message || 'Failed to update order status')
    }
  }

  // Update payment status
  async updatePaymentStatus(orderId: string, status: Order['payment_status']): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', orderId)
      await updateDoc(orderRef, {
        payment_status: status,
        updated_at: serverTimestamp()
      })
    } catch (error: any) {
      console.error('Error updating payment status:', error)
      throw new Error(error.message || 'Failed to update payment status')
    }
  }

  // Cancel order
  async cancelOrder(orderId: string, reason?: string): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', orderId)
      await updateDoc(orderRef, {
        order_status: 'cancelled',
        cancellation_reason: reason,
        updated_at: serverTimestamp()
      })
    } catch (error: any) {
      console.error('Error cancelling order:', error)
      throw new Error(error.message || 'Failed to cancel order')
    }
  }

  // Process refund (via Cloud Function)
  async processRefund(orderId: string, amount?: number, reason?: string): Promise<any> {
    try {
      const processRefund = httpsCallable(functions, 'processRefund')
      const result = await processRefund({
        orderId,
        refundAmount: amount,
        reason
      })
      
      return result.data
    } catch (error: any) {
      console.error('Error processing refund:', error)
      throw new Error(error.message || 'Failed to process refund')
    }
  }

  // Process replacement (via Cloud Function)
  async processReplacement(orderId: string, items: any[], reason?: string): Promise<any> {
    try {
      const processReplacement = httpsCallable(functions, 'processReplacement')
      const result = await processReplacement({
        orderId,
        items,
        reason
      })
      
      return result.data
    } catch (error: any) {
      console.error('Error processing replacement:', error)
      throw new Error(error.message || 'Failed to process replacement')
    }
  }

  // Create guest session (via Cloud Function)
  async createGuestSession(contactInfo: {
    email: string
    name: string
    phone?: string
  }): Promise<GuestSession> {
    try {
      const createGuestSession = httpsCallable(functions, 'createGuestSession')
      const result = await createGuestSession(contactInfo)
      
      return result.data as GuestSession
    } catch (error: any) {
      console.error('Error creating guest session:', error)
      throw new Error(error.message || 'Failed to create guest session')
    }
  }

  // Validate guest session (via Cloud Function)
  async validateGuestSession(guestSessionId: string): Promise<boolean> {
    try {
      const validateGuestSession = httpsCallable(functions, 'validateGuestSession')
      const result = await validateGuestSession({ guestSessionId })
      
      return (result.data as any)?.valid || false
    } catch (error: any) {
      console.error('Error validating guest session:', error)
      return false
    }
  }

  // Extend guest session (via Cloud Function)
  async extendGuestSession(guestSessionId: string): Promise<GuestSession> {
    try {
      const extendGuestSession = httpsCallable(functions, 'extendGuestSession')
      const result = await extendGuestSession({ guestSessionId })
      
      return result.data as GuestSession
    } catch (error: any) {
      console.error('Error extending guest session:', error)
      throw new Error(error.message || 'Failed to extend guest session')
    }
  }

  // Merge guest orders (via Cloud Function)
  async mergeGuestOrders(userId: string, guestSessionId?: string, guestContactInfo?: any): Promise<GuestOrderMergeResult> {
    try {
      const mergeGuestOrders = httpsCallable(functions, 'mergeGuestOrders')
      const result = await mergeGuestOrders({
        userId,
        guestSessionId,
        guestContactInfo
      })
      
      return result.data as GuestOrderMergeResult
    } catch (error: any) {
      console.error('Error merging guest orders:', error)
      return {
        success: false,
        merged_orders_count: 0,
        total_merged_amount: 0,
        error: error?.message || 'Unknown error occurred'
      }
    }
  }

  // Send OTP (via Cloud Function)
  async sendOtp(identifier: string, channel: 'email' | 'phone', purpose: 'cod_verification' | 'phone_update' | 'cancel' | 'replacement' = 'cod_verification'): Promise<{
    success: boolean
    error?: string
    message?: string
  }> {
    try {
      const sendOtp = httpsCallable(functions, 'sendOtp')
      const result = await sendOtp({
        identifier,
        channel,
        purpose
      })
      
      return result.data as {
        success: boolean
        error?: string
        message?: string
      }
    } catch (error: any) {
      console.error('Error sending OTP:', error)
      return {
        success: false,
        error: error?.message || 'Failed to send OTP'
      }
    }
  }

  // Verify OTP (via Cloud Function)
  async verifyOtp(identifier: string, channel: 'email' | 'phone', otp: string, purpose?: 'cod_verification' | 'phone_update' | 'cancel' | 'replacement'): Promise<{
    success: boolean
    error?: string
    codAuthToken?: string
    message?: string
  }> {
    try {
      const verifyOtp = httpsCallable(functions, 'verifyOtp')
      const result = await verifyOtp({
        identifier,
        channel,
        otp,
        purpose
      })
      
      return result.data as {
        success: boolean
        error?: string
        codAuthToken?: string
        message?: string
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error)
      return {
        success: false,
        error: error?.message || 'Failed to verify OTP'
      }
    }
  }

  // Get order analytics for admin
  async getOrderAnalytics(startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const getOrderAnalytics = httpsCallable(functions, 'getOrderAnalytics')
      const result = await getOrderAnalytics({
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      })
      
      return result.data
    } catch (error: any) {
      console.error('Error getting order analytics:', error)
      throw new Error(error.message || 'Failed to get order analytics')
    }
  }

  // Get all orders for admin (with pagination)
  async getAllOrders(page = 1, limitCount = 20, filters?: any): Promise<{
    success: boolean
    orders: Order[]
    totalPages: number
    currentPage: number
    totalOrders: number
    error?: string
  }> {
    try {
      const getAllOrders = httpsCallable(functions, 'getAllOrders')
      const result = await getAllOrders({
        page,
        limit: limitCount,
        filters
      })
      
      const data = result.data as any
      return {
        success: true,
        orders: data.orders || [],
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || page,
        totalOrders: data.totalOrders || 0
      }
    } catch (error: any) {
      console.error('Error getting all orders:', error)
      return {
        success: false,
        orders: [],
        totalPages: 1,
        currentPage: page,
        totalOrders: 0,
        error: error.message || 'Failed to get all orders'
      }
    }
  }
}

export const orderService = OrderService.getInstance()
