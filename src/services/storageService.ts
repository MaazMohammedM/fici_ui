import { ref, getDownloadURL, uploadBytes, uploadString, deleteObject } from '@/lib/firebase'
import { storage } from '@/lib/firebase'

class StorageService {
  private static instance: StorageService

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService()
    }
    return StorageService.instance
  }

  // Get download URL for a file
  async getDownloadURL(path: string): Promise<string> {
    try {
      const fileRef = ref(storage, path)
      const url = await getDownloadURL(fileRef)
      return url
    } catch (error: any) {
      console.error('Error getting download URL:', error)
      throw new Error(error.message || 'Failed to get download URL')
    }
  }

  // Upload file from blob or file
  async uploadFile(path: string, file: File | Blob): Promise<string> {
    try {
      const fileRef = ref(storage, path)
      const snapshot = await uploadBytes(fileRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      return downloadURL
    } catch (error: any) {
      console.error('Error uploading file:', error)
      throw new Error(error.message || 'Failed to upload file')
    }
  }

  // Upload file from base64 data URL
  async uploadBase64(path: string, dataURL: string, metadata?: any): Promise<string> {
    try {
      const fileRef = ref(storage, path)
      const snapshot = await uploadString(fileRef, dataURL, 'data_url', metadata)
      const downloadURL = await getDownloadURL(snapshot.ref)
      return downloadURL
    } catch (error: any) {
      console.error('Error uploading base64 file:', error)
      throw new Error(error.message || 'Failed to upload base64 file')
    }
  }

  // Delete file
  async deleteFile(path: string): Promise<void> {
    try {
      const fileRef = ref(storage, path)
      await deleteObject(fileRef)
    } catch (error: any) {
      console.error('Error deleting file:', error)
      throw new Error(error.message || 'Failed to delete file')
    }
  }

  // Get product image URL
  async getProductImageURL(imageName: string, size?: 'thumbnail' | 'medium' | 'large'): Promise<string> {
    try {
      const path = size ? `products/${size}/${imageName}` : `products/${imageName}`
      return await this.getDownloadURL(path)
    } catch (error: any) {
      console.error('Error getting product image URL:', error)
      throw new Error(error.message || 'Failed to get product image URL')
    }
  }

  // Upload product image
  async uploadProductImage(imageName: string, file: File | Blob, size?: 'thumbnail' | 'medium' | 'large'): Promise<string> {
    try {
      const path = size ? `products/${size}/${imageName}` : `products/${imageName}`
      return await this.uploadFile(path, file)
    } catch (error: any) {
      console.error('Error uploading product image:', error)
      throw new Error(error.message || 'Failed to upload product image')
    }
  }

  // Get user avatar URL
  async getUserAvatarURL(userId: string, fileName: string): Promise<string> {
    try {
      const path = `users/${userId}/avatar/${fileName}`
      return await this.getDownloadURL(path)
    } catch (error: any) {
      console.error('Error getting user avatar URL:', error)
      throw new Error(error.message || 'Failed to get user avatar URL')
    }
  }

  // Upload user avatar
  async uploadUserAvatar(userId: string, fileName: string, file: File | Blob): Promise<string> {
    try {
      const path = `users/${userId}/avatar/${fileName}`
      return await this.uploadFile(path, file)
    } catch (error: any) {
      console.error('Error uploading user avatar:', error)
      throw new Error(error.message || 'Failed to upload user avatar')
    }
  }

  // Get order document URL
  async getOrderDocumentURL(orderId: string, fileName: string): Promise<string> {
    try {
      const path = `orders/${orderId}/${fileName}`
      return await this.getDownloadURL(path)
    } catch (error: any) {
      console.error('Error getting order document URL:', error)
      throw new Error(error.message || 'Failed to get order document URL')
    }
  }

  // Upload order document
  async uploadOrderDocument(orderId: string, fileName: string, file: File | Blob): Promise<string> {
    try {
      const path = `orders/${orderId}/${fileName}`
      return await this.uploadFile(path, file)
    } catch (error: any) {
      console.error('Error uploading order document:', error)
      throw new Error(error.message || 'Failed to upload order document')
    }
  }

  // Get category image URL
  async getCategoryImageURL(categoryName: string, fileName: string): Promise<string> {
    try {
      const path = `categories/${categoryName}/${fileName}`
      return await this.getDownloadURL(path)
    } catch (error: any) {
      console.error('Error getting category image URL:', error)
      throw new Error(error.message || 'Failed to get category image URL')
    }
  }

  // Upload category image
  async uploadCategoryImage(categoryName: string, fileName: string, file: File | Blob): Promise<string> {
    try {
      const path = `categories/${categoryName}/${fileName}`
      return await this.uploadFile(path, file)
    } catch (error: any) {
      console.error('Error uploading category image:', error)
      throw new Error(error.message || 'Failed to upload category image')
    }
  }

  // Generate thumbnail URL (fallback if thumbnail doesn't exist)
  async getThumbnailURL(originalPath: string): Promise<string> {
    try {
      // Try to get thumbnail first
      const thumbnailPath = originalPath.replace(/\/([^\/]+)$/, '/thumbnails/$1')
      try {
        return await this.getDownloadURL(thumbnailPath)
      } catch {
        // If thumbnail doesn't exist, return original
        return await this.getDownloadURL(originalPath)
      }
    } catch (error: any) {
      console.error('Error getting thumbnail URL:', error)
      throw new Error(error.message || 'Failed to get thumbnail URL')
    }
  }

  // Batch upload multiple files
  async uploadMultipleFiles(files: Array<{ path: string; file: File | Blob }>): Promise<Array<{ path: string; url: string }>> {
    try {
      const uploadPromises = files.map(async ({ path, file }) => {
        const url = await this.uploadFile(path, file)
        return { path, url }
      })
      
      return await Promise.all(uploadPromises)
    } catch (error: any) {
      console.error('Error uploading multiple files:', error)
      throw new Error(error.message || 'Failed to upload multiple files')
    }
  }

  // Batch delete multiple files
  async deleteMultipleFiles(paths: string[]): Promise<void> {
    try {
      const deletePromises = paths.map(path => this.deleteFile(path))
      await Promise.all(deletePromises)
    } catch (error: any) {
      console.error('Error deleting multiple files:', error)
      throw new Error(error.message || 'Failed to delete multiple files')
    }
  }

  // Check if file exists (by trying to get download URL)
  async fileExists(path: string): Promise<boolean> {
    try {
      await this.getDownloadURL(path)
      return true
    } catch {
      return false
    }
  }

  // Get file metadata (basic implementation)
  async getFileMetadata(path: string): Promise<any> {
    try {
      const fileRef = ref(storage, path)
      // Note: Firebase Storage doesn't have direct metadata access like Supabase
      // This is a placeholder - you might need to store metadata separately in Firestore
      return {
        path,
        exists: await this.fileExists(path)
      }
    } catch (error: any) {
      console.error('Error getting file metadata:', error)
      throw new Error(error.message || 'Failed to get file metadata')
    }
  }
}

export const storageService = StorageService.getInstance()
