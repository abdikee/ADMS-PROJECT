import logger from '../config/logger.js'
import { cache } from '../config/redis.js'

// Internationalization and Localization Middleware
class I18nMiddleware {
  constructor() {
    this.defaultLocale = 'en'
    this.supportedLocales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar']
    this.translations = new Map()
    this.formatters = new Map()
    this.loadTranslations()
  }

  // Load translations from files or database
  async loadTranslations() {
    try {
      // Load English translations (base)
      const enTranslations = {
        // Common
        'common.ok': 'OK',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.view': 'View',
        'common.search': 'Search',
        'common.filter': 'Filter',
        'common.sort': 'Sort',
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.success': 'Success',
        'common.warning': 'Warning',
        'common.info': 'Information',
        
        // Authentication
        'auth.login': 'Login',
        'auth.logout': 'Logout',
        'auth.username': 'Username',
        'auth.password': 'Password',
        'auth.forgot_password': 'Forgot Password?',
        'auth.remember_me': 'Remember Me',
        'auth.login_success': 'Login successful',
        'auth.login_failed': 'Login failed',
        'auth.invalid_credentials': 'Invalid credentials',
        'auth.account_locked': 'Account locked',
        'auth.session_expired': 'Session expired',
        
        // User Management
        'user.profile': 'Profile',
        'user.settings': 'Settings',
        'user.preferences': 'Preferences',
        'user.first_name': 'First Name',
        'user.last_name': 'Last Name',
        'user.email': 'Email',
        'user.phone': 'Phone',
        'user.address': 'Address',
        'user.date_of_birth': 'Date of Birth',
        'user.gender': 'Gender',
        'user.role': 'Role',
        'user.student': 'Student',
        'user.teacher': 'Teacher',
        'user.admin': 'Administrator',
        
        // Academic
        'academic.grade': 'Grade',
        'academic.class': 'Class',
        'academic.section': 'Section',
        'academic.subject': 'Subject',
        'academic.marks': 'Marks',
        'academic.attendance': 'Attendance',
        'academic.exam': 'Exam',
        'academic.assignment': 'Assignment',
        'academic.report': 'Report',
        'academic.transcript': 'Transcript',
        'academic.admission': 'Admission',
        'academic.graduation': 'Graduation',
        
        // Messages
        'msg.student_created': 'Student created successfully',
        'msg.student_updated': 'Student updated successfully',
        'msg.student_deleted': 'Student deleted successfully',
        'msg.teacher_created': 'Teacher created successfully',
        'msg.teacher_updated': 'Teacher updated successfully',
        'msg.teacher_deleted': 'Teacher deleted successfully',
        'msg.class_created': 'Class created successfully',
        'msg.class_updated': 'Class updated successfully',
        'msg.class_deleted': 'Class deleted successfully',
        'msg.subject_created': 'Subject created successfully',
        'msg.subject_updated': 'Subject updated successfully',
        'msg.subject_deleted': 'Subject deleted successfully',
        
        // Errors
        'error.not_found': 'Resource not found',
        'error.unauthorized': 'Unauthorized access',
        'error.forbidden': 'Access forbidden',
        'error.validation_failed': 'Validation failed',
        'error.server_error': 'Internal server error',
        'error.database_error': 'Database error',
        'error.network_error': 'Network error',
        'error.timeout': 'Request timeout',
        'error.rate_limit': 'Rate limit exceeded',
        'error.file_too_large': 'File too large',
        'error.invalid_format': 'Invalid file format',
        'error.duplicate_entry': 'Duplicate entry',
        'error.required_field': 'Required field missing',
        
        // GDPR
        'gdpr.data_export': 'Export My Data',
        'gdpr.data_delete': 'Delete My Data',
        'gdpr.consent_manage': 'Manage Consent',
        'gdpr.data_summary': 'Data Summary',
        'gdpr.processing_records': 'Processing Records',
        'gdpr.export_success': 'Data exported successfully',
        'gdpr.delete_success': 'Data deleted successfully',
        'gdpr.consent_updated': 'Consent preferences updated',
        
        // Time
        'time.now': 'Now',
        'time.today': 'Today',
        'time.yesterday': 'Yesterday',
        'time.tomorrow': 'Tomorrow',
        'time.this_week': 'This Week',
        'time.last_week': 'Last Week',
        'time.this_month': 'This Month',
        'time.last_month': 'Last Month',
        'time.this_year': 'This Year',
        'time.last_year': 'Last Year',
        
        // Numbers
        'number.zero': 'Zero',
        'number.one': 'One',
        'number.two': 'Two',
        'number.few': 'Few',
        'number.many': 'Many',
        'number.other': 'Other'
      }

      // Load other languages (simplified for demo)
      const esTranslations = {
        'common.ok': 'Aceptar',
        'common.cancel': 'Cancelar',
        'common.save': 'Guardar',
        'common.delete': 'Eliminar',
        'auth.login': 'Iniciar Sesión',
        'auth.logout': 'Cerrar Sesión',
        'auth.username': 'Nombre de Usuario',
        'auth.password': 'Contraseña',
        'user.first_name': 'Nombre',
        'user.last_name': 'Apellido',
        'user.email': 'Correo Electrónico',
        'academic.grade': 'Grado',
        'academic.class': 'Clase',
        'academic.subject': 'Asignatura',
        'error.not_found': 'Recurso no encontrado',
        'error.unauthorized': 'Acceso no autorizado',
        'msg.student_created': 'Estudiante creado exitosamente'
      }

      const frTranslations = {
        'common.ok': 'OK',
        'common.cancel': 'Annuler',
        'common.save': 'Enregistrer',
        'common.delete': 'Supprimer',
        'auth.login': 'Connexion',
        'auth.logout': 'Déconnexion',
        'auth.username': 'Nom d\'utilisateur',
        'auth.password': 'Mot de passe',
        'user.first_name': 'Prénom',
        'user.last_name': 'Nom',
        'user.email': 'Email',
        'academic.grade': 'Niveau',
        'academic.class': 'Classe',
        'academic.subject': 'Matière',
        'error.not_found': 'Ressource non trouvée',
        'error.unauthorized': 'Accès non autorisé',
        'msg.student_created': 'Étudiant créé avec succès'
      }

      // Store translations
      this.translations.set('en', enTranslations)
      this.translations.set('es', esTranslations)
      this.translations.set('fr', frTranslations)

      // Initialize formatters
      this.initializeFormatters()

      logger.info('Translations loaded successfully', { 
        locales: this.supportedLocales.length 
      })
    } catch (error) {
      logger.error('Failed to load translations', { error: error.message })
    }
  }

  // Initialize locale-specific formatters
  initializeFormatters() {
    // Date formatters
    this.formatters.set('en', {
      date: new Intl.DateTimeFormat('en-US'),
      time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }),
      datetime: new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      currency: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      number: new Intl.NumberFormat('en-US')
    })

    this.formatters.set('es', {
      date: new Intl.DateTimeFormat('es-ES'),
      time: new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }),
      datetime: new Intl.DateTimeFormat('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      currency: new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }),
      number: new Intl.NumberFormat('es-ES')
    })

    this.formatters.set('fr', {
      date: new Intl.DateTimeFormat('fr-FR'),
      time: new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      datetime: new Intl.DateTimeFormat('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      currency: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }),
      number: new Intl.NumberFormat('fr-FR')
    })
  }

  // Detect locale from request
  detectLocale(req) {
    // Priority: User preference > Accept-Language header > Default
    let locale = this.defaultLocale

    // Check user preference (if authenticated)
    if (req.user && req.user.locale) {
      locale = req.user.locale
    } else {
      // Check Accept-Language header
      const acceptLanguage = req.get('Accept-Language')
      if (acceptLanguage) {
        const preferredLocales = acceptLanguage
          .split(',')
          .map(lang => lang.split(';')[0].trim().toLowerCase())
        
        for (const preferredLocale of preferredLocales) {
          // Check exact match
          if (this.supportedLocales.includes(preferredLocale)) {
            locale = preferredLocale
            break
          }
          
          // Check language-only match (e.g., 'en-US' -> 'en')
          const langOnly = preferredLocale.split('-')[0]
          if (this.supportedLocales.includes(langOnly)) {
            locale = langOnly
            break
          }
        }
      }
    }

    return locale
  }

  // Translate text
  translate(key, locale = this.defaultLocale, params = {}) {
    const translations = this.translations.get(locale) || this.translations.get(this.defaultLocale)
    let text = translations[key] || key

    // Replace parameters
    for (const [param, value] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), value)
    }

    return text
  }

  // Format date
  formatDate(date, locale = this.defaultLocale, format = 'date') {
    const formatters = this.formatters.get(locale) || this.formatters.get(this.defaultLocale)
    const formatter = formatters[format]
    
    if (!formatter) {
      return date.toString()
    }

    return formatter.format(new Date(date))
  }

  // Format number
  formatNumber(number, locale = this.defaultLocale, options = {}) {
    const formatters = this.formatters.get(locale) || this.formatters.get(this.defaultLocale)
    
    if (options.style === 'currency') {
      return formatters.currency.format(number)
    }
    
    return formatters.number.format(number)
  }

  // Format relative time
  formatRelativeTime(date, locale = this.defaultLocale) {
    const now = new Date()
    const target = new Date(date)
    const diffMs = now - target
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSeconds < 60) {
      return this.translate('time.now', locale)
    } else if (diffMinutes < 60) {
      return this.translate('time.today', locale)
    } else if (diffHours < 24) {
      return this.translate('time.today', locale)
    } else if (diffDays < 7) {
      return this.translate('time.this_week', locale)
    } else if (diffDays < 30) {
      return this.translate('time.this_month', locale)
    } else if (diffDays < 365) {
      return this.translate('time.this_year', locale)
    } else {
      return this.translate('time.last_year', locale)
    }
  }

  // Middleware function
  middleware() {
    return (req, res, next) => {
      // Detect locale
      const locale = this.detectLocale(req)
      
      // Set locale on request
      req.locale = locale
      req.t = (key, params = {}) => this.translate(key, locale, params)
      req.formatDate = (date, format = 'date') => this.formatDate(date, locale, format)
      req.formatNumber = (number, options) => this.formatNumber(number, locale, options)
      req.formatRelativeTime = (date) => this.formatRelativeTime(date, locale)
      
      // Set locale header
      res.setHeader('Content-Language', locale)
      
      // Override res.json to translate responses
      const originalJson = res.json.bind(res)
      res.json = (data) => {
        if (typeof data === 'object' && data !== null) {
          // Translate error messages
          if (data.error && typeof data.error === 'string') {
            data.error = this.translate(data.error, locale)
          }
          
          // Translate message fields
          if (data.message && typeof data.message === 'string') {
            data.message = this.translate(data.message, locale)
          }
          
          // Add locale info
          data.locale = locale
        }
        
        return originalJson(data)
      }
      
      next()
    }
  }

  // Get supported locales
  getSupportedLocales() {
    return this.supportedLocales
  }

  // Add new translation
  addTranslation(locale, key, value) {
    if (!this.translations.has(locale)) {
      this.translations.set(locale, {})
    }
    
    const translations = this.translations.get(locale)
    translations[key] = value
    
    logger.info('Translation added', { locale, key })
  }

  // Update user locale preference
  async updateUserLocale(userId, locale) {
    if (!this.supportedLocales.includes(locale)) {
      throw new Error(`Unsupported locale: ${locale}`)
    }

    try {
      // Cache user preference
      await cache.set(`user_locale:${userId}`, locale, 86400) // 24 hours
      
      logger.info('User locale updated', { userId, locale })
    } catch (error) {
      logger.error('Failed to update user locale', { error: error.message, userId, locale })
      throw error
    }
  }

  // Get user locale preference
  async getUserLocale(userId) {
    try {
      const cachedLocale = await cache.get(`user_locale:${userId}`)
      return cachedLocale || this.defaultLocale
    } catch (error) {
      logger.error('Failed to get user locale', { error: error.message, userId })
      return this.defaultLocale
    }
  }
}

// Create singleton instance
const i18n = new I18nMiddleware()

export default i18n
