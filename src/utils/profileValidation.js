export function getMaxDateForAge(minimumAge = 18, referenceDate = new Date()) {
  const maxDate = new Date(referenceDate)
  maxDate.setFullYear(maxDate.getFullYear() - minimumAge)

  const year = maxDate.getFullYear()
  const month = String(maxDate.getMonth() + 1).padStart(2, '0')
  const day = String(maxDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isAdultDateOfBirth(dateOfBirth, minimumAge = 18) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth || '')
  if (!match) return false
  const [, year, month, day] = match
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day))
  if (
    parsedDate.getFullYear() !== Number(year) ||
    parsedDate.getMonth() !== Number(month) - 1 ||
    parsedDate.getDate() !== Number(day)
  ) return false
  return dateOfBirth <= getMaxDateForAge(minimumAge)
}

export function isValidPhoneNumber(phoneNumber) {
  const value = String(phoneNumber || '').trim()
  return /^\d{7,15}$/.test(value) && !/^(\d)\1+$/.test(value)
}

export function validateProfileDetails(profile) {
  if (!isAdultDateOfBirth(profile.dateOfBirth)) {
    return 'You must be at least 18 years old.'
  }
  if (!isValidPhoneNumber(profile.phoneNumber)) {
    return 'Enter a phone number using 7 to 15 digits only.'
  }
  return ''
}
