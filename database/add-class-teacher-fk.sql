-- Add foreign key constraint for homeroom_teacher_id in classes table
USE sams_db;

-- Check if foreign key exists, if not add it
SET @dbname = DATABASE();
SET @tablename = 'classes';
SET @columnname = 'homeroom_teacher_id';
SET @fk_name = 'classes_ibfk_2';

-- Drop foreign key if it exists (to avoid duplicate errors)
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND CONSTRAINT_NAME = @fk_name
  ) > 0,
  CONCAT('ALTER TABLE ', @tablename, ' DROP FOREIGN KEY ', @fk_name),
  'SELECT "Foreign key does not exist"'
));

PREPARE alterIfExists FROM @preparedStatement;
EXECUTE alterIfExists;
DEALLOCATE PREPARE alterIfExists;

-- Add the foreign key constraint
ALTER TABLE classes 
ADD CONSTRAINT classes_ibfk_2 
FOREIGN KEY (homeroom_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;

SELECT 'Foreign key constraint added successfully' as result;
