-- ============================================
-- Update ID Ranges for Students and Teachers
-- ============================================
-- This script updates the AUTO_INCREMENT values
-- to ensure IDs are less than 10 digits
-- ============================================

USE sams_db;

-- Update Teachers table AUTO_INCREMENT
-- Teachers will start from 100001 (6 digits)
-- Max: 999999999 (9 digits) - plenty of room
ALTER TABLE teachers AUTO_INCREMENT = 100001;

-- Update Students table AUTO_INCREMENT  
-- Students will start from 200001 (6 digits)
-- Max: 999999999 (9 digits) - plenty of room
ALTER TABLE students AUTO_INCREMENT = 200001;

-- Verify the changes
SELECT 
    TABLE_NAME,
    AUTO_INCREMENT,
    CONCAT('Next ID will be: ', AUTO_INCREMENT) as next_id_info
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'sams_db' 
  AND TABLE_NAME IN ('students', 'teachers');

-- Show current max IDs (if any data exists)
SELECT 
    'teachers' as table_name,
    COALESCE(MAX(id), 0) as current_max_id,
    100001 as new_start_id
FROM teachers
UNION ALL
SELECT 
    'students' as table_name,
    COALESCE(MAX(id), 0) as current_max_id,
    200001 as new_start_id
FROM students;
