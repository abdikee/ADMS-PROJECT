// Accessibility middleware for API responses
export const accessibilityHeaders = (req, res, next) => {
  // Add accessibility headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Add screen reader friendly headers
  res.setHeader('X-Accessibility-Enabled', 'true')
  
  next()
}

// Format data for screen readers
export const formatForAccessibility = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => ({
      ...item,
      _screenReaderText: generateScreenReaderText(item)
    }))
  }
  
  if (typeof data === 'object' && data !== null) {
    return {
      ...data,
      _screenReaderText: generateScreenReaderText(data)
    }
  }
  
  return data
}

// Generate screen reader friendly text
const generateScreenReaderText = (obj) => {
  if (!obj || typeof obj !== 'object') return ''
  
  const text = []
  
  // Handle different object types
  if (obj.first_name && obj.last_name) {
    text.push(`Name: ${obj.first_name} ${obj.last_name}`)
  }
  
  if (obj.email) {
    text.push(`Email: ${obj.email}`)
  }
  
  if (obj.role) {
    text.push(`Role: ${obj.role}`)
  }
  
  if (obj.grade) {
    text.push(`Grade: ${obj.grade}`)
  }
  
  if (obj.section) {
    text.push(`Section: ${obj.section}`)
  }
  
  if (obj.status) {
    text.push(`Status: ${obj.status}`)
  }
  
  return text.join('. ')
}

// Validate accessibility requirements
export const validateAccessibility = (req, res, next) => {
  // Check for required accessibility headers in request
  const accessibilityHeader = req.get('X-Accessibility-Mode')
  
  if (accessibilityHeader === 'screen-reader') {
    req.accessibilityMode = 'screen-reader'
    res.setHeader('X-Accessibility-Mode', 'screen-reader')
  }
  
  next()
}
