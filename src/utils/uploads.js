import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { auth, storage } from '../firebase'

const API_URL = import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:4242'

export function resolveUploadUrl(path) {
    if (typeof path !== 'string' || !path) return ''
    if (/^https?:\/\/(localhost|127\.0\.0\.1):4242\/uploads\//i.test(path)) {
        return new URL(new URL(path).pathname, API_URL).toString()
    }
    if (/^(https?:|data:|blob:)/i.test(path)) return path
    if (path.startsWith('/uploads/')) return new URL(path, API_URL).toString()
    return path
}

export async function uploadFile(file, category = 'property-media') {
    const user = auth.currentUser
    if (!user) {
        throw new Error('Sign in before uploading a file.')
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `uploads/${category}/${user.uid}/${Date.now()}-${safeName}`
    const storageRef = ref(storage, filePath)

    await uploadBytes(storageRef, file, {
        contentType: file.type || 'application/octet-stream',
    })

    return getDownloadURL(storageRef)
}
