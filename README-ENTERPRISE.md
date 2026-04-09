# Student Academic Record Management System (Enterprise Edition)

## Overview

This is a comprehensive, enterprise-grade Student Academic Record Management System (SAMS) built with modern security, monitoring, and compliance features. The system has been enhanced to meet industry standards and regulatory requirements.

## Key Features

### Core Functionality
- **Multi-role Authentication**: Admin, Teacher, and Student roles with secure JWT-based authentication
- **Academic Record Management**: Comprehensive student records, grades, attendance, and course management
- **Real-time Updates**: WebSocket-based real-time notifications and updates
- **File Management**: Secure file upload and management for profiles and documents

### Enterprise Features

#### Security & Compliance
- **GDPR Compliance**: Full GDPR compliance with data portability, right to deletion, and consent management
- **Advanced Security**: Rate limiting, security headers, SQL injection protection, and comprehensive logging
- **OWASP Top 10**: Protection against all OWASP Top 10 security risks
- **Data Encryption**: Secure password hashing with bcrypt and encrypted data transmission

#### Monitoring & Observability
- **Comprehensive Logging**: Winston-based structured logging with daily rotation
- **Performance Monitoring**: Request tracking, slow query detection, and memory monitoring
- **Health Checks**: Detailed health endpoints with system metrics
- **Error Tracking**: Centralized error logging and alerting

#### Performance & Scalability
- **Redis Caching**: Multi-layer caching strategy for improved performance
- **Database Optimization**: Connection pooling and query optimization
- **Rate Limiting**: Intelligent rate limiting to prevent abuse
- **Compression**: Response compression for faster load times

#### DevOps & Deployment
- **CI/CD Pipeline**: GitHub Actions with automated testing and deployment
- **Docker Support**: Multi-stage Docker builds for production
- **Backup & Recovery**: Automated backup and disaster recovery procedures
- **Environment Management**: Multi-environment support with proper configuration

#### Testing & Quality
- **Comprehensive Testing**: Unit, integration, and E2E tests with Jest
- **Code Quality**: ESLint and Prettier for consistent code formatting
- **Security Testing**: Automated vulnerability scanning with Trivy
- **Coverage Reporting**: Detailed test coverage reports

#### API & Documentation
- **OpenAPI/Swagger**: Comprehensive API documentation
- **Versioned API**: Proper API versioning and backward compatibility
- **Interactive Docs**: Swagger UI for interactive API exploration

## Architecture

### Technology Stack
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Redis caching
- **Frontend**: React, Vite, TailwindCSS
- **Authentication**: JWT with bcrypt
- **Monitoring**: Winston, custom monitoring middleware
- **Testing**: Jest, Supertest
- **Deployment**: Docker, GitHub Actions

### System Architecture
```
Frontend (React) -> API Gateway -> Authentication -> Business Logic -> Database Layer
                    -> Rate Limiting -> Security Headers -> Monitoring -> Logging
                    -> Cache Layer -> Backup Services -> Compliance Layer
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ADMS-PROJECT
```

2. **Install dependencies**
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ..
npm install
```

3. **Set up environment variables**
```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit the file with your configuration
nano backend/.env
```

4. **Set up database**
```bash
# Create database and run migrations
createdb sams_db
psql -d sams_db -f database/schema.sql
psql -d sams_db -f database/gdpr-schema.sql
```

5. **Start Redis**
```bash
redis-server
```

6. **Run the application**
```bash
# Development mode
cd backend
npm run dev

# Production mode
npm start
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build custom image
docker build -t sams-app .
docker run -p 5000:5000 sams-app
```

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sams_db
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_jwt_secret_at_least_32_characters_long
NODE_ENV=production

# CORS
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com

# Server
PORT=5000
```

### Security Configuration

The system includes comprehensive security features:
- Rate limiting with different limits for different endpoints
- Security headers (HSTS, CSP, XSS protection)
- Input validation and sanitization
- SQL injection protection
- Authentication and authorization

## API Documentation

### Accessing API Docs
- **Swagger UI**: `http://localhost:5000/api-docs`
- **OpenAPI JSON**: `http://localhost:5000/api-docs.json`

### Key Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

#### GDPR Compliance
- `GET /api/gdpr/data-summary` - Get data summary
- `GET /api/gdpr/export` - Export user data
- `POST /api/gdpr/delete` - Delete user data (Right to be forgotten)
- `GET /api/gdpr/consent` - Get consent preferences
- `POST /api/gdpr/consent` - Update consent preferences

#### Monitoring
- `GET /health` - Health check with metrics
- `GET /metrics` - Performance and system metrics

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Structure
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **Security Tests**: Authentication and authorization testing

## Monitoring & Logging

### Log Levels
- **Error**: Critical errors and exceptions
- **Warn**: Security events and warnings
- **Info**: General application events
- **Debug**: Detailed debugging information

### Log Files
- `logs/error-YYYY-MM-DD.log` - Error logs
- `logs/combined-YYYY-MM-DD.log` - All logs
- `logs/security-YYYY-MM-DD.log` - Security events

### Metrics
- Request response times
- Error rates
- Database query performance
- Memory usage
- Cache hit rates

## Backup & Recovery

### Automated Backups
```bash
# Full system backup
node scripts/backup.js full

# Database only
node scripts/backup.js database

# List available backups
node scripts/backup.js list

# Restore from backup
node scripts/backup.js restore <timestamp>
```

### Backup Schedule
- **Daily**: Full system backup at 2 AM
- **Weekly**: Database optimization and cleanup
- **Monthly**: Archive old backups

## GDPR Compliance

### Data Subject Rights
1. **Right to Access**: Users can request a summary of their data
2. **Right to Portability**: Users can export their data in machine-readable format
3. **Right to Erasure**: Users can request permanent deletion of their data
4. **Right to Consent**: Users can manage their consent preferences

### Data Protection
- Data encryption at rest and in transit
- Access logging and audit trails
- Data retention policies
- Secure data deletion procedures

## Performance Optimization

### Caching Strategy
- **User Data**: 1 hour cache
- **Academic Records**: 30 minutes cache
- **Reference Data**: 2 hours cache
- **Reports**: 30 minutes cache

### Database Optimization
- Connection pooling
- Query optimization
- Index management
- Slow query monitoring

## Security Best Practices

### Authentication
- Strong password policies
- Account lockout after failed attempts
- Session management
- Multi-factor authentication (optional)

### Data Protection
- Input validation
- Output encoding
- SQL injection prevention
- XSS protection

### Network Security
- HTTPS enforcement
- CORS configuration
- Rate limiting
- DDoS protection

## Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Check connection
psql -h localhost -U user -d sams_db
```

#### Redis Connection
```bash
# Check Redis status
redis-cli ping

# Check memory usage
redis-cli info memory
```

#### Application Logs
```bash
# View recent logs
tail -f logs/combined-$(date +%Y-%m-%d).log

# View error logs
tail -f logs/error-$(date +%Y-%m-%d).log
```

### Performance Issues
1. Check system metrics: `GET /metrics`
2. Review slow query logs
3. Monitor memory usage
4. Check cache hit rates

## Deployment

### Production Deployment

1. **Environment Setup**
   - Configure production environment variables
   - Set up SSL certificates
   - Configure reverse proxy (Nginx)

2. **Database Setup**
   - Configure PostgreSQL with proper security
   - Set up Redis cluster if needed
   - Run database migrations

3. **Application Deployment**
   - Build Docker image
   - Deploy to production environment
   - Configure monitoring and logging

4. **Post-Deployment**
   - Run health checks
   - Monitor performance
   - Set up backup schedules

### CI/CD Pipeline

The GitHub Actions pipeline includes:
- Code quality checks
- Security scanning
- Automated testing
- Docker image building
- Deployment to staging/production

## Support

### Documentation
- API Documentation: `/api-docs`
- System Architecture: See architecture section
- Troubleshooting: See troubleshooting section

### Monitoring
- Health checks: `/health`
- Metrics: `/metrics`
- Logs: Check log files

### Security
- Security events: Check security logs
- Vulnerability scanning: Automated in CI/CD
- Security headers: Automatically applied

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## Version History

- **v1.0.0**: Initial enterprise release with all security, monitoring, and compliance features
- **v0.9.0**: Basic functionality
- **v1.1.0**: Enhanced monitoring and performance features
- **v1.2.0**: GDPR compliance and accessibility improvements

---

**Note**: This enterprise edition includes all the security, monitoring, and compliance features required for production deployment in regulated environments.
