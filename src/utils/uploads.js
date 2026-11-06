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

export async function uploadFile(file) {
    const formData = new FormData()
    formData.append('file', file, file.name)

    let response
    try {
        response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData,
        })
    } catch (error) {
        throw new Error(
            `Cannot reach the upload server at ${API_URL}. Start it with "npm start --prefix server" and try again.`,
            { cause: error }
        )
    }
    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.error || 'Could not upload file.')
    }
    if (!data.filePath) {
        throw new Error('The upload server did not return a file path.')
    }

    return resolveUploadUrl(data.filePath)
}
