import { getDownloadURL, ref, uploadBytes, uploadBytesResumable } from 'firebase/storage'
import { auth, storage } from '../firebase'

const API_URL = import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:4242'
const IMAGE_COMPRESSION_THRESHOLD = 2 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 1920
const RESUMABLE_UPLOAD_THRESHOLD = 256 * 1024
const UPLOAD_STALL_TIMEOUT = 90 * 1000

export function resolveUploadUrl(path) {
    if (typeof path !== 'string' || !path) return ''
    if (/^https?:\/\/(localhost|127\.0\.0\.1):4242\/uploads\//i.test(path)) {
        return new URL(new URL(path).pathname, API_URL).toString()
    }
    if (/^(https?:|data:|blob:)/i.test(path)) return path
    if (path.startsWith('/uploads/')) return new URL(path, API_URL).toString()
    return path
}

async function optimizePropertyImage(file) {
    if (
        file.size < IMAGE_COMPRESSION_THRESHOLD
        || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
        || typeof createImageBitmap !== 'function'
    ) {
        return file
    }

    const bitmap = await createImageBitmap(file)
    try {
        const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(bitmap.width * scale)
        canvas.height = Math.round(bitmap.height * scale)
        const context = canvas.getContext('2d')
        if (!context) return file
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

        const compressed = await new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/webp', 0.82)
        })
        if (!compressed || compressed.type !== 'image/webp' || compressed.size >= file.size) {
            return file
        }

        const baseName = file.name.replace(/\.[^.]+$/, '')
        return new File([compressed], `${baseName}.webp`, {
            type: compressed.type,
            lastModified: file.lastModified,
        })
    } finally {
        bitmap.close()
    }
}

async function uploadApiFile(file, user, category, onProgress) {
    const token = await user.getIdToken()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)

    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest()
        request.open('POST', new URL('/api/upload', API_URL))
        request.setRequestHeader('Authorization', `Bearer ${token}`)
        request.timeout = UPLOAD_STALL_TIMEOUT
        onProgress?.({ phase: 'uploading', progress: 0 })

        request.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                onProgress?.({
                    phase: 'uploading',
                    progress: Math.round((event.loaded / event.total) * 100),
                })
            }
        })
        request.addEventListener('load', () => {
            let response
            try {
                response = JSON.parse(request.responseText)
            } catch {
                reject(new Error('The upload server returned an invalid response.'))
                return
            }

            if (request.status < 200 || request.status >= 300) {
                reject(new Error(response.error || `Could not upload file (${request.status}).`))
                return
            }
            if (typeof response.filePath !== 'string') {
                reject(new Error('The upload server did not return the photo URL.'))
                return
            }

            onProgress?.({ phase: 'uploading', progress: 100 })
            resolve(new URL(response.filePath, API_URL).toString())
        })
        request.addEventListener('error', () => {
            reject(new Error('Could not reach the photo upload server. Check your connection and try again.'))
        })
        request.addEventListener('timeout', () => {
            reject(new Error('The photo upload timed out. Please try again.'))
        })
        request.addEventListener('abort', () => {
            reject(new Error('The photo upload was cancelled.'))
        })
        request.send(formData)
    })
}

export async function uploadFile(file, category = 'property-media', onProgress) {
    const user = auth.currentUser
    if (!user) {
        throw new Error('Sign in before uploading a file.')
    }

    onProgress?.({ phase: 'preparing', progress: 0 })
    const preparedFile = category === 'property-media' ? await optimizePropertyImage(file) : file
    if (category === 'property-media' || category === 'verification') {
        return uploadApiFile(preparedFile, user, category, onProgress)
    }

    const safeName = preparedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `uploads/${category}/${user.uid}/${Date.now()}-${safeName}`
    const storageRef = ref(storage, filePath)

    if (preparedFile.size <= RESUMABLE_UPLOAD_THRESHOLD) {
        onProgress?.({ phase: 'saving', progress: 0 })
        await uploadBytes(storageRef, preparedFile, {
            contentType: preparedFile.type || 'application/octet-stream',
        })
        onProgress?.({ phase: 'uploading', progress: 100 })
        return getDownloadURL(storageRef)
    }

    onProgress?.({ phase: 'uploading', progress: 0 })
    const uploadTask = uploadBytesResumable(storageRef, preparedFile, {
        contentType: preparedFile.type || 'application/octet-stream',
    })

    await new Promise((resolve, reject) => {
        let settled = false
        let timeoutId
        let unsubscribe
        let lastTransferred = 0

        const finish = (callback, value) => {
            if (settled) return
            settled = true
            clearTimeout(timeoutId)
            unsubscribe?.()
            callback(value)
        }

        const resetStallTimeout = () => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => {
                if (settled) return
                finish(
                    reject,
                    new Error('Upload stopped making progress. Check your internet connection and try again.')
                )
                uploadTask.cancel()
            }, UPLOAD_STALL_TIMEOUT)
        }

        unsubscribe = uploadTask.on('state_changed', (snapshot) => {
            if (snapshot.bytesTransferred > lastTransferred) {
                lastTransferred = snapshot.bytesTransferred
                resetStallTimeout()
            }
            const progress = snapshot.totalBytes
                ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
                : 0
            onProgress?.({ phase: 'uploading', progress })
        }, (error) => finish(reject, error), () => finish(resolve))
        resetStallTimeout()
    })

    return getDownloadURL(storageRef)
}
