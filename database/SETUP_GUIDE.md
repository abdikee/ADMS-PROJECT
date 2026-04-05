# MySQL Installation and Database Setup Guide

## Step 1: Complete MySQL Installation

MySQL has been downloaded, but you need to complete the installation:

### Option A: Using MySQL Installer (Recommended)

1. **Locate MySQL Installer**
   - Check your Downloads folder
   - Or download from: https://dev.mysql.com/downloads/installer/

2. **Run MySQL Installer**
   - Double-click the installer
   - Choose "Custom" installation type
   - Select these components:
     - MySQL Server 8.4
     - MySQL Workbench (optional, but helpful)
     - MySQL Shell (optional)

3. **Configure MySQL Server**
   - Choose "Development Computer" for Type and Networking
   - Port: 3306 (default)
   - Authentication Method: Use Strong Password Encryption
   - Set Root Password: Choose a strong password and REMEMBER IT!
   - Windows Service: Yes, start at system startup
   - Service Name: MySQL84

4. **Complete Installation**
   - Click Execute to apply configuration
   - Wait for installation to complete
   - Click Finish

### Option B: Quick Setup via Command Line

If MySQL is already installed but not configured:

```powershell
# Add MySQL to PATH (restart terminal after this)
$env:Path += ";C:\Program Files\MySQL\MySQL Server 8.4\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path, [EnvironmentVariableTarget]::Machine)

# Initialize MySQL (run as Administrator)
mysqld --initialize-insecure
mysqld --install
net start MySQL84
```

## Step 2: Verify MySQL Installation

Open a NEW PowerShell window and run:

```powershell
mysql --version
```

You should see: `mysql  Ver 8.4.8 for Win64 on x86_64`

## Step 3: Test MySQL Connection

```powershell
mysql -u root -p
```

Enter your root password when prompted. If successful, you'll see:

```
mysql>
```

Type `exit` to quit.

## Step 4: Create the Database

### Method 1: Using PowerShell Script (Easiest)

```powershell
cd database
.\setup.ps1
```

Follow the prompts:
- Enter MySQL username: `root`
- Enter MySQL password: [your password]

### Method 2: Using MySQL Command Line

```powershell
# Navigate to database folder
cd database

# Run the schema
mysql -u root -p < schema.sql
```

Enter your password when prompted.

### Method 3: Using MySQL Workbench (GUI)

1. Open MySQL Workbench
2. Connect to your local MySQL instance
3. Click "File" → "Open SQL Script"
4. Select `database/schema.sql`
5. Click the lightning bolt icon to execute

## Step 5: Verify Database Creation

```powershell
mysql -u root -p
```

Then in MySQL:

```sql
SHOW DATABASES;
USE sams_db;
SHOW TABLES;
SELECT * FROM users;
exit
```

You should see:
- Database: `sams_db`
- 21 tables
- 1 admin user

## Step 6: Configure Your Application

Update your application's database configuration:

```javascript
// Example configuration
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'your_password',
  database: 'sams_db'
};
```

## Troubleshooting

### MySQL Command Not Found

**Problem:** `mysql : The term 'mysql' is not recognized`

**Solution:**
1. Restart your terminal/PowerShell
2. Or manually add to PATH:
   ```powershell
   $env:Path += ";C:\Program Files\MySQL\MySQL Server 8.4\bin"
   ```

### MySQL Service Not Running

**Problem:** Can't connect to MySQL

**Solution:**
```powershell
# Start MySQL service
net start MySQL84

# Or using Services
services.msc
# Find MySQL84, right-click, Start
```

### Access Denied Error

**Problem:** `ERROR 1045 (28000): Access denied`

**Solution:**
- Verify your password
- Reset root password if forgotten:
  ```powershell
  mysqld --skip-grant-tables
  mysql -u root
  ```
  Then in MySQL:
  ```sql
  FLUSH PRIVILEGES;
  ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
  exit
  ```

### Port Already in Use

**Problem:** Port 3306 is already in use

**Solution:**
- Check if another MySQL instance is running
- Or change the port in MySQL configuration

## Default Credentials

After setup, use these credentials:

### Admin Login
- Username: `admin`
- Password: `admin123`
- **⚠️ CHANGE THIS PASSWORD IMMEDIATELY!**

### Database Access
- Host: `localhost`
- Port: `3306`
- Database: `sams_db`
- User: `root`
- Password: [your MySQL root password]

## Next Steps

1. ✅ MySQL installed and running
2. ✅ Database created
3. ✅ Tables and default data loaded
4. 🔄 Configure your application
5. 🔄 Change default admin password
6. 🔄 Create additional database users (optional)
7. 🔄 Set up regular backups

## Quick Reference Commands

```powershell
# Check MySQL status
Get-Service MySQL84

# Start MySQL
net start MySQL84

# Stop MySQL
net stop MySQL84

# Connect to MySQL
mysql -u root -p

# Backup database
mysqldump -u root -p sams_db > backup.sql

# Restore database
mysql -u root -p sams_db < backup.sql

# Show databases
mysql -u root -p -e "SHOW DATABASES;"

# Show tables
mysql -u root -p sams_db -e "SHOW TABLES;"
```

## Support

If you encounter issues:

1. Check MySQL error log:
   - Location: `C:\ProgramData\MySQL\MySQL Server 8.4\Data\*.err`

2. Verify MySQL is running:
   ```powershell
   Get-Service MySQL84
   ```

3. Test connection:
   ```powershell
   mysql -u root -p -e "SELECT 1;"
   ```

## Security Recommendations

1. **Change Default Passwords**
   ```sql
   ALTER USER 'admin'@'localhost' IDENTIFIED BY 'new_secure_password';
   ```

2. **Create Application User**
   ```sql
   CREATE USER 'sams_app'@'localhost' IDENTIFIED BY 'secure_password';
   GRANT SELECT, INSERT, UPDATE, DELETE ON sams_db.* TO 'sams_app'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **Enable Firewall Rules**
   - Only allow local connections
   - Or restrict to specific IPs

4. **Regular Backups**
   - Set up automated daily backups
   - Store backups securely
   - Test restore procedures

## Additional Resources

- MySQL Documentation: https://dev.mysql.com/doc/
- MySQL Workbench: https://www.mysql.com/products/workbench/
- MySQL Tutorial: https://www.mysqltutorial.org/
