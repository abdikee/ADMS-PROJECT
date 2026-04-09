-- GDPR Compliance Schema
-- This file contains tables and procedures for GDPR compliance

-- User Consents Table
CREATE TABLE IF NOT EXISTS user_consents (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    analytics_consent BOOLEAN DEFAULT TRUE,
    data_processing_consent BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Data Deletion Requests Table
CREATE TABLE IF NOT EXISTS data_deletion_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    request_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    completion_date TIMESTAMPTZ,
    ip_address VARCHAR(45),
    user_agent TEXT,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Data Export Requests Table
CREATE TABLE IF NOT EXISTS data_export_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    request_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    completion_date TIMESTAMPTZ,
    export_file_path VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Data Processing Activities Table
CREATE TABLE IF NOT EXISTS data_processing_activities (
    id BIGSERIAL PRIMARY KEY,
    activity_name VARCHAR(100) NOT NULL,
    activity_description TEXT,
    data_categories TEXT[], -- Array of data categories processed
    legal_basis VARCHAR(50), -- e.g., 'consent', 'contractual', 'legal_obligation'
    retention_period VARCHAR(50), -- e.g., '7 years', 'until deletion'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert default data processing activities
INSERT INTO data_processing_activities (activity_name, activity_description, data_categories, legal_basis, retention_period) VALUES
('User Authentication', 'Processing login credentials and session management', ARRAY['username', 'password_hash', 'session_data'], 'contractual', 'until_account_deletion'),
('Academic Record Management', 'Managing student grades, attendance, and academic progress', ARRAY['grades', 'attendance', 'course_registrations'], 'contractual', '7_years_after_graduation'),
('System Administration', 'System logs, security monitoring, and maintenance', ARRAY['ip_addresses', 'user_agent', 'access_logs'], 'legal_obligation', '1_year'),
('Communication', 'Sending notifications and system communications', ARRAY['email', 'phone'], 'consent', 'until_consent_withdrawn'),
('Analytics and Reporting', 'System usage analytics and performance monitoring', ARRAY['usage_patterns', 'performance_data'], 'consent', '2_years')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id ON data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status ON data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON data_export_requests(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_consents_updated_at 
    BEFORE UPDATE ON user_consents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_processing_activities_updated_at 
    BEFORE UPDATE ON data_processing_activities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- GDPR Procedures

-- Procedure to anonymize user data (soft delete)
CREATE OR REPLACE FUNCTION anonymize_user_data(p_user_id BIGINT)
RETURNS VOID AS $$
DECLARE
    v_username TEXT;
    v_user_role TEXT;
BEGIN
    -- Get user info
    SELECT username, role INTO v_username, v_user_role
    FROM users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Anonymize user account
    UPDATE users SET
        username = 'deleted_user_' || p_user_id,
        password = '',
        last_login = NULL
    WHERE id = p_user_id;
    
    -- Anonymize student data if applicable
    IF v_user_role = 'student' THEN
        UPDATE students SET
            first_name = 'Deleted',
            last_name = 'User',
            email = NULL,
            phone = NULL,
            address = NULL,
            parent_guardian_name = NULL,
            parent_guardian_phone = NULL,
            parent_guardian_email = NULL,
            emergency_contact = NULL,
            emergency_phone = NULL
        WHERE user_id = p_user_id;
    END IF;
    
    -- Anonymize teacher data if applicable
    IF v_user_role = 'teacher' THEN
        UPDATE teachers SET
            first_name = 'Deleted',
            last_name = 'User',
            email = NULL,
            phone = NULL,
            address = NULL,
            emergency_contact = NULL,
            emergency_phone = NULL
        WHERE user_id = p_user_id;
    END IF;
    
    -- Log the anonymization
    INSERT INTO activity_log (user_id, action, description, ip_address)
    VALUES (p_user_id, 'DATA_ANONYMIZED', 'User data anonymized per GDPR request', '127.0.0.1');
    
END;
$$ LANGUAGE plpgsql;

-- Procedure to permanently delete user data
CREATE OR REPLACE FUNCTION permanently_delete_user_data(p_user_id BIGINT)
RETURNS VOID AS $$
DECLARE
    v_username TEXT;
    v_user_role TEXT;
    v_student_id BIGINT;
    v_teacher_id BIGINT;
BEGIN
    -- Get user info
    SELECT username, role INTO v_username, v_user_role
    FROM users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Get role-specific IDs
    IF v_user_role = 'student' THEN
        SELECT id INTO v_student_id FROM students WHERE user_id = p_user_id;
    ELSIF v_user_role = 'teacher' THEN
        SELECT id INTO v_teacher_id FROM teachers WHERE user_id = p_user_id;
    END IF;
    
    -- Delete in order of dependencies
    
    -- Delete student data
    IF v_student_id IS NOT NULL THEN
        DELETE FROM assignment_submissions WHERE student_id = v_student_id;
        DELETE FROM course_registrations WHERE student_id = v_student_id;
        DELETE FROM attendance WHERE student_id = v_student_id;
        DELETE FROM marks WHERE student_id = v_student_id;
        DELETE FROM book_issues WHERE student_id = v_student_id;
        DELETE FROM fee_payments WHERE student_id = v_student_id;
        DELETE FROM students WHERE id = v_student_id;
    END IF;
    
    -- Delete teacher data
    IF v_teacher_id IS NOT NULL THEN
        DELETE FROM teacher_subjects WHERE teacher_id = v_teacher_id;
        UPDATE classes SET homeroom_teacher_id = NULL WHERE homeroom_teacher_id = v_teacher_id;
        DELETE FROM teachers WHERE id = v_teacher_id;
    END IF;
    
    -- Delete user-related data
    DELETE FROM user_consents WHERE user_id = p_user_id;
    DELETE FROM data_deletion_requests WHERE user_id = p_user_id;
    DELETE FROM data_export_requests WHERE user_id = p_user_id;
    DELETE FROM activity_log WHERE user_id = p_user_id;
    DELETE FROM login_attempts WHERE username = v_username;
    DELETE FROM users WHERE id = p_user_id;
    
END;
$$ LANGUAGE plpgsql;

-- Function to get data retention summary
CREATE OR REPLACE FUNCTION get_data_retention_summary(p_user_id BIGINT)
RETURNS TABLE(
    data_category TEXT,
    record_count BIGINT,
    oldest_record TIMESTAMPTZ,
    retention_policy TEXT
) AS $$
DECLARE
    v_user_role TEXT;
    v_student_id BIGINT;
    v_teacher_id BIGINT;
BEGIN
    -- Get user role
    SELECT role INTO v_user_role FROM users WHERE id = p_user_id;
    
    -- Basic user info
    RETURN QUERY
    SELECT 
        'Basic User Information'::TEXT,
        COUNT(*)::BIGINT,
        MIN(created_at),
        'Until account deletion'::TEXT
    FROM users WHERE id = p_user_id;
    
    -- Student-specific data
    IF v_user_role = 'student' THEN
        SELECT id INTO v_student_id FROM students WHERE user_id = p_user_id;
        
        IF v_student_id IS NOT NULL THEN
            -- Academic records
            RETURN QUERY
            SELECT 
                'Academic Records'::TEXT,
                COUNT(*)::BIGINT,
                MIN(created_at),
                '7 years after graduation'::TEXT
            FROM marks WHERE student_id = v_student_id;
            
            -- Attendance records
            RETURN QUERY
            SELECT 
                'Attendance Records'::TEXT,
                COUNT(*)::BIGINT,
                MIN(date),
                '7 years after graduation'::TEXT
            FROM attendance WHERE student_id = v_student_id;
        END IF;
    END IF;
    
    -- Teacher-specific data
    IF v_user_role = 'teacher' THEN
        SELECT id INTO v_teacher_id FROM teachers WHERE user_id = p_user_id;
        
        IF v_teacher_id IS NOT NULL THEN
            -- Teaching assignments
            RETURN QUERY
            SELECT 
                'Teaching Assignments'::TEXT,
                COUNT(*)::BIGINT,
                MIN(created_at),
                'Until employment ends'::TEXT
            FROM teacher_subjects WHERE teacher_id = v_teacher_id;
        END IF;
    END IF;
    
    -- System logs
    RETURN QUERY
    SELECT 
        'System Logs'::TEXT,
        COUNT(*)::BIGINT,
        MIN(created_at),
        '1 year'::TEXT
    FROM activity_log WHERE user_id = p_user_id;
    
END;
$$ LANGUAGE plpgsql;

-- View for data processing transparency
CREATE OR REPLACE VIEW gdpr_data_processing_summary AS
SELECT 
    u.id as user_id,
    u.username,
    u.role,
    dpa.activity_name,
    dpa.activity_description,
    dpa.data_categories,
    dpa.legal_basis,
    dpa.retention_period,
    uc.data_processing_consent,
    uc.updated_at as consent_updated_at
FROM users u
CROSS JOIN data_processing_activities dpa
LEFT JOIN user_consents uc ON u.id = uc.user_id
WHERE u.is_active = TRUE;

-- Grant necessary permissions (adjust as needed)
-- GRANT SELECT ON gdpr_data_processing_summary TO sams_app;
-- GRANT EXECUTE ON FUNCTION anonymize_user_data(BIGINT) TO sams_app;
-- GRANT EXECUTE ON FUNCTION permanently_delete_user_data(BIGINT) TO sams_app;
-- GRANT EXECUTE ON FUNCTION get_data_retention_summary(BIGINT) TO sams_app;
