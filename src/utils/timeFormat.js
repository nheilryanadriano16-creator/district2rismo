export function toTimeInputValue(value) {
    const time = String(value || '').trim()
    const twentyFourHourTime = time.match(/^([01]\d|2[0-3]):([0-5]\d)$/)
    if (twentyFourHourTime) return `${twentyFourHourTime[1]}:${twentyFourHourTime[2]}`

    const twelveHourTime = time.match(/^(1[0-2]|0?[1-9]):([0-5]\d)\s*(AM|PM)$/i)
    if (!twelveHourTime) return ''

    let hours = Number(twelveHourTime[1]) % 12
    if (twelveHourTime[3].toUpperCase() === 'PM') hours += 12
    return `${String(hours).padStart(2, '0')}:${twelveHourTime[2]}`
}

export function toDisplayTime(value) {
    const time = toTimeInputValue(value)
    if (!time) return String(value || '')

    const [hourText, minutes] = time.split(':')
    const hour = Number(hourText)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${String(displayHour).padStart(2, '0')}:${minutes} ${period}`
}
