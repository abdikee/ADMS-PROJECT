import helmet from 'helmet'
import logger from '../config/logger.js'

// Security headers configuration
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"]
    }
  },
  
  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false,
  
  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: { policy: "same-origin" },
  
  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { policy: "cross-origin" },
  
  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  
  // Expect-CT
  expectCt: {
    maxAge: 86400,
    enforce: true
  },
  
  // Feature Policy
  permittedCrossDomainPolicies: false,
  
  // HSTS
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  
  // IE Compatibility
  ieNoOpen: true,
  
  // No Sniff
  noSniff: true,
  
  // Origin Agent Cluster
  originAgentCluster: true,
  
  // Permission Policy
  permissionsPolicy: {
    features: {
      camera: ["'none'"],
      microphone: ["'none'"],
      geolocation: ["'none'"],
      payment: ["'none'"],
      usb: ["'none'"],
      magnetometer: ["'none'"],
      gyroscope: ["'none'"],
      accelerometer: ["'none'"]
    }
  },
  
  // Referrer Policy
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  
  // X-Content-Type-Options
  xContentTypeOptions: true,
  
  // X-DNS-Prefetch-Control
  xDnsPrefetchControl: false,
  
  // X-Download-Options
  xDownloadOptions: true,
  
  // X-Frame-Options
  xFrameOptions: { action: "deny" },
  
  // X-Permitted-Cross-Domain-Policies
  xPermittedCrossDomainPolicies: false,
  
  // X-XSS-Protection
  xXssProtection: true
})

// Security monitoring middleware
export const securityMonitor = (req, res, next) => {
  // Log suspicious requests
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS attempt
    /union.*select/i,  // SQL injection attempt
    /javascript:/i,  // JavaScript protocol
    /data:.*base64/i,  // Base64 data URI
    /%3cscript/i,  // URL encoded XSS
    /%3e/i,  // URL encoded closing tag
    /eval\(/i,  // Eval function
    /exec\(/i,  // Exec function
    /system\(/i  // System function
  ]
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(req.url) || 
    pattern.test(JSON.stringify(req.query)) ||
    pattern.test(JSON.stringify(req.body))
  )
  
  if (isSuspicious) {
    logger.security('Suspicious request detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      query: req.query,
      body: req.method === 'POST' ? { ...req.body, password: '[REDACTED]' } : req.body,
      userId: req.user?.id
    })
  }
  
  // Check for missing required headers
  const requiredHeaders = ['user-agent', 'accept']
  const missingHeaders = requiredHeaders.filter(header => !req.get(header))
  
  if (missingHeaders.length > 0) {
    logger.security('Missing required headers', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      missingHeaders,
      userId: req.user?.id
    })
  }
  
  // Monitor large requests
  const contentLength = req.get('content-length')
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
    logger.security('Large request detected', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      contentLength: `${Math.round(parseInt(contentLength) / 1024 / 1024)}MB`,
      userId: req.user?.id
    })
  }
  
  next()
}

// IP blocking middleware (basic implementation)
export const ipBlocker = (req, res, next) => {
  const blockedIPs = new Set() // In production, this should come from a database or Redis
  
  if (blockedIPs.has(req.ip)) {
    logger.security('Blocked IP attempted access', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method
    })
    
    return res.status(403).json({
      error: 'Access denied'
    })
  }
  
  next()
}

// Add custom security headers
export const customSecurityHeaders = (req, res, next) => {
  // Add custom headers
  res.setHeader('X-API-Version', '1.0.0')
  res.setHeader('X-Response-Time', Date.now().toString())
  res.setHeader('X-Powered-By', 'SAMS')
  
  // Remove server information
  res.removeHeader('Server')
  
  next()
}
