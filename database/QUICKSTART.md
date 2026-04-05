# Quick Start Guide - Database Setup

## ⚡ Fast Setup (3 Steps)

### Step 1: Complete MySQL Installation

MySQL has been downloaded. Now complete the setup:

1. **Find MySQL Installer** in your Downloads folder or Start Menu
2. **Run the installer** and follow the wizard
3. **Set a root password** (remember this!)
4. **Restart your terminal/PowerShell**

### Step 2: Run Database Setup

Open PowerShell in the `database` folder and run:

```powershell
.\setup.bat
```

Or:

```powershell
.\setup.ps1
```

Enter your MySQL root password when prompted.

### Step 3: Verify

```powershell
mysql -u root -p
```

Then:

```sql
SHOW DATABASES;
USE sams_db;
SHOW TABLES;
exit
```

## ✅ Done!

Your database is ready with:
- ✅ 21 tables
- ✅ 4 views
- ✅ 2 stored procedures
- ✅ Default admin user (username: `admin`, password: `admin123`)

## 🚀 Next Steps

1. Update your app's database config
2. Change the default admin password
3. Start your application

## ❌ Troubleshooting

### "mysql not recognized"
**Solution:** Restart your terminal or add MySQL to PATH:
```powershell
$env:Path += ";C:\Program Files\MySQL\MySQL Server 8.4\bin"
```

### "Can't connect to MySQL"
**Solution:** Start MySQL service:
```powershell
net start MySQL84
```

### "Access denied"
**Solution:** Check your password or reset it using MySQL Installer

## 📚 Need More Help?

See `SETUP_GUIDE.md` for detailed instructions.
