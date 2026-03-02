import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  googleProvider,
  type User,
  type UserCredential
} from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface UserProfile {
  user_id: string
  email: string
  first_name: string
  last_name?: string
  phone_number?: string
  phone_verified?: boolean
  role: 'user' | 'admin'
  created_at?: any
  updated_at?: any
}

export interface AuthState {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  error: string | null
}

class AuthService {
  private static instance: AuthService

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password.trim())
      const user = userCredential.user
      
      // Ensure user profile exists
      await this.ensureUserProfile(user)
      
      return user
    } catch (error: any) {
      console.error('Sign in error:', error)
      throw new Error(error.message || 'Sign in failed')
    }
  }

  // Sign up with email and password
  async signUp(userData: {
    firstName: string
    lastName: string
    email: string
    mobile?: string
    password: string
  }): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)
      const user = userCredential.user
      
      // Create user profile
      await this.createUserProfile(user, {
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone_number: userData.mobile || null,
        role: 'user'
      })
      
      return user
    } catch (error: any) {
      console.error('Sign up error:', error)
      throw new Error(error.message || 'Sign up failed')
    }
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<void> {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error: any) {
      console.error('Google sign in error:', error)
      throw new Error(error.message || 'Google sign in failed')
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error: any) {
      console.error('Sign out error:', error)
      throw new Error(error.message || 'Sign out failed')
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        await this.ensureUserProfile(user)
      }
      callback(user)
    })
  }

  // Ensure user profile exists
  private async ensureUserProfile(user: User): Promise<UserProfile | null> {
    try {
      const profileRef = doc(db, 'user_profiles', user.uid)
      const profileSnap = await getDoc(profileRef)

      if (!profileSnap.exists()) {
        // Create profile if it doesn't exist
        const firstName = user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'User'
        const lastName = user.displayName?.split(' ').slice(1).join(' ') || ''
        
        await this.createUserProfile(user, {
          first_name: firstName,
          last_name: lastName,
          role: 'user'
        })
        
        return {
          user_id: user.uid,
          email: user.email || '',
          first_name: firstName,
          last_name: lastName,
          role: 'user'
        }
      }

      return profileSnap.data() as UserProfile
    } catch (error) {
      console.error('Error ensuring user profile:', error)
      return null
    }
  }

  // Create user profile
  private async createUserProfile(user: User, profileData: Partial<UserProfile>): Promise<void> {
    try {
      const profileRef = doc(db, 'user_profiles', user.uid)
      await setDoc(profileRef, {
        user_id: user.uid,
        email: user.email || '',
        first_name: profileData.first_name || 'User',
        last_name: profileData.last_name || '',
        phone_number: profileData.phone_number || null,
        phone_verified: false,
        role: profileData.role || 'user',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      })
    } catch (error: any) {
      console.error('Error creating user profile:', error)
      throw new Error(error.message || 'Failed to create user profile')
    }
  }

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const profileRef = doc(db, 'user_profiles', userId)
      await setDoc(profileRef, {
        ...updates,
        updated_at: serverTimestamp()
      }, { merge: true })
    } catch (error: any) {
      console.error('Error updating user profile:', error)
      throw new Error(error.message || 'Failed to update user profile')
    }
  }

  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profileRef = doc(db, 'user_profiles', userId)
      const profileSnap = await getDoc(profileRef)
      
      if (profileSnap.exists()) {
        return profileSnap.data() as UserProfile
      }
      return null
    } catch (error: any) {
      console.error('Error getting user profile:', error)
      throw new Error(error.message || 'Failed to get user profile')
    }
  }

  // Update phone number
  async updatePhoneNumber(userId: string, phoneNumber: string): Promise<void> {
    try {
      await this.updateUserProfile(userId, {
        phone_number: phoneNumber,
        phone_verified: true
      })
    } catch (error: any) {
      console.error('Error updating phone number:', error)
      throw new Error(error.message || 'Failed to update phone number')
    }
  }
}

export const authService = AuthService.getInstance()
