import pool from '../config/database.js';
import bcrypt from 'bcrypt';

let ensureUserProfilesTablePromise;

function ensureUserProfilesTable() {
  if (!ensureUserProfilesTablePromise) {
    ensureUserProfilesTablePromise = pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL UNIQUE,
        full_name VARCHAR(120),
        email VARCHAR(120),
        phone VARCHAR(30),
        profile_photo VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }

  return ensureUserProfilesTablePromise;
}

async function fetchAdminProfile(userId) {
  await ensureUserProfilesTable();

  const [profiles] = await pool.query(`
    SELECT
      u.id AS user_id,
      u.username,
      u.role,
      u.last_login,
      u.created_at,
      COALESCE(up.full_name, 'Administrator') AS full_name,
      COALESCE(up.email, 'admin@edurecord.com') AS email,
      up.phone,
      up.profile_photo
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE u.id = ?
    LIMIT 1
  `, [userId]);

  if (profiles.length === 0) {
    throw new Error('User not found');
  }

  const profile = profiles[0];

  return {
    userId: String(profile.user_id),
    profileType: 'admin',
    username: profile.username,
    role: profile.role,
    lastLogin: profile.last_login,
    createdAt: profile.created_at,
    name: profile.full_name,
    email: profile.email,
    phone: profile.phone || '',
    profilePhoto: profile.profile_photo || '',
  };
}

async function fetchTeacherProfile(userId) {
  const [profiles] = await pool.query(`
    SELECT
      u.id AS user_id,
      u.username,
      u.role,
      u.last_login,
      u.created_at,
      t.id AS profile_id,
      t.first_name,
      t.last_name,
      t.email,
      t.phone,
      t.date_of_birth,
      t.qualification,
      t.hire_date,
      t.address,
      t.emergency_contact,
      t.emergency_phone,
      t.profile_photo,
      d.name AS department_name,
      MAX(sub.name) AS subject_name,
      STRING_AGG(DISTINCT cls.name, '||' ORDER BY cls.name) AS assigned_class_names,
      MAX(home.name) AS homeroom_class_name
    FROM users u
    JOIN teachers t ON t.user_id = u.id
    LEFT JOIN departments d ON d.id = t.department_id
    LEFT JOIN teacher_subjects ts ON ts.teacher_id = t.id
    LEFT JOIN subjects sub ON sub.id = ts.subject_id
    LEFT JOIN classes cls ON cls.id = ts.class_id
    LEFT JOIN classes home ON home.homeroom_teacher_id = t.id
    WHERE u.id = ?
    GROUP BY
      u.id, u.username, u.role, u.last_login, u.created_at, t.id, t.first_name, t.last_name,
      t.email, t.phone, t.date_of_birth, t.qualification, t.hire_date, t.address,
      t.emergency_contact, t.emergency_phone, t.profile_photo, d.name
    LIMIT 1
  `, [userId]);

  if (profiles.length === 0) {
    throw new Error('Teacher profile not found');
  }

  const profile = profiles[0];

  return {
    userId: String(profile.user_id),
    profileId: String(profile.profile_id),
    profileType: 'teacher',
    username: profile.username,
    role: profile.role,
    lastLogin: profile.last_login,
    createdAt: profile.created_at,
    name: `${profile.first_name} ${profile.last_name}`.trim(),
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email || '',
    phone: profile.phone || '',
    dateOfBirth: profile.date_of_birth,
    qualification: profile.qualification || '',
    hireDate: profile.hire_date,
    address: profile.address || '',
    emergencyContact: profile.emergency_contact || '',
    emergencyPhone: profile.emergency_phone || '',
    profilePhoto: profile.profile_photo || '',
    departmentName: profile.department_name || '',
    subjectName: profile.subject_name || '',
    assignedClasses: profile.assigned_class_names ? profile.assigned_class_names.split('||').filter(Boolean) : [],
    homeroomClassName: profile.homeroom_class_name || '',
  };
}

async function fetchStudentProfile(userId) {
  const [profiles] = await pool.query(`
    SELECT
      u.id AS user_id,
      u.username,
      u.role,
      u.last_login,
      u.created_at,
      s.id AS profile_id,
      s.first_name,
      s.last_name,
      s.email,
      s.phone,
      s.date_of_birth,
      s.gender,
      s.blood_group,
      s.address,
      s.parent_guardian_name,
      s.parent_guardian_phone,
      s.parent_guardian_email,
      s.emergency_contact,
      s.emergency_phone,
      s.profile_photo,
      s.roll_number,
      s.admission_number,
      s.admission_date,
      c.name AS class_name,
      c.grade,
      c.section
    FROM users u
    JOIN students s ON s.user_id = u.id
    LEFT JOIN classes c ON c.id = s.class_id
    WHERE u.id = ?
    LIMIT 1
  `, [userId]);

  if (profiles.length === 0) {
    throw new Error('Student profile not found');
  }

  const profile = profiles[0];

  return {
    userId: String(profile.user_id),
    profileId: String(profile.profile_id),
    profileType: 'student',
    username: profile.username,
    role: profile.role,
    lastLogin: profile.last_login,
    createdAt: profile.created_at,
    name: `${profile.first_name} ${profile.last_name}`.trim(),
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email || '',
    phone: profile.phone || '',
    dateOfBirth: profile.date_of_birth,
    gender: profile.gender || '',
    bloodGroup: profile.blood_group || '',
    address: profile.address || '',
    parentGuardianName: profile.parent_guardian_name || '',
    parentGuardianPhone: profile.parent_guardian_phone || '',
    parentGuardianEmail: profile.parent_guardian_email || '',
    emergencyContact: profile.emergency_contact || '',
    emergencyPhone: profile.emergency_phone || '',
    profilePhoto: profile.profile_photo || '',
    rollNumber: profile.roll_number || '',
    admissionNumber: profile.admission_number || '',
    admissionDate: profile.admission_date,
    className: profile.class_name || '',
    grade: profile.grade || '',
    section: profile.section || '',
  };
}

async function fetchProfileForUser(user) {
  if (user.role === 'admin') {
    return fetchAdminProfile(user.id);
  }

  if (user.role === 'teacher') {
    return fetchTeacherProfile(user.id);
  }

  if (user.role === 'student') {
    return fetchStudentProfile(user.id);
  }

  throw new Error('Unsupported user role');
}

export const getMyProfile = async (req, res) => {
  try {
    const profile = await fetchProfileForUser(req.user);
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch profile' });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      await ensureUserProfilesTable();

      const currentProfile = await fetchAdminProfile(req.user.id);
      const merged = {
        name: req.body.name ?? currentProfile.name,
        email: req.body.email ?? currentProfile.email,
        phone: req.body.phone ?? currentProfile.phone,
        profilePhoto: req.body.profilePhoto ?? currentProfile.profilePhoto,
      };

      await pool.query(
        `INSERT INTO user_profiles (user_id, full_name, email, phone, profile_photo)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (user_id) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           email = EXCLUDED.email,
           phone = EXCLUDED.phone,
           profile_photo = EXCLUDED.profile_photo,
           updated_at = CURRENT_TIMESTAMP`,
        [req.user.id, merged.name, merged.email, merged.phone || null, merged.profilePhoto || null]
      );
    } else if (req.user.role === 'teacher') {
      const fieldMap = {
        firstName: 'first_name',
        lastName: 'last_name',
        email: 'email',
        phone: 'phone',
        dateOfBirth: 'date_of_birth',
        qualification: 'qualification',
        address: 'address',
        emergencyContact: 'emergency_contact',
        emergencyPhone: 'emergency_phone',
        profilePhoto: 'profile_photo',
      };

      const fields = [];
      const values = [];

      Object.entries(fieldMap).forEach(([key, column]) => {
        if (req.body[key] !== undefined) {
          fields.push(`${column} = ?`);
          values.push(req.body[key] || null);
        }
      });

      if (fields.length === 0) {
        return res.status(400).json({ error: 'No profile fields to update' });
      }

      values.push(req.user.id);

      await pool.query(
        `UPDATE teachers SET ${fields.join(', ')} WHERE user_id = ?`,
        values
      );
    } else if (req.user.role === 'student') {
      const fieldMap = {
        firstName: 'first_name',
        lastName: 'last_name',
        email: 'email',
        phone: 'phone',
        dateOfBirth: 'date_of_birth',
        gender: 'gender',
        bloodGroup: 'blood_group',
        address: 'address',
        parentGuardianName: 'parent_guardian_name',
        parentGuardianPhone: 'parent_guardian_phone',
        parentGuardianEmail: 'parent_guardian_email',
        emergencyContact: 'emergency_contact',
        emergencyPhone: 'emergency_phone',
        profilePhoto: 'profile_photo',
      };

      const fields = [];
      const values = [];

      Object.entries(fieldMap).forEach(([key, column]) => {
        if (req.body[key] !== undefined) {
          fields.push(`${column} = ?`);
          values.push(req.body[key] || null);
        }
      });

      if (fields.length === 0) {
        return res.status(400).json({ error: 'No profile fields to update' });
      }

      values.push(req.user.id);

      await pool.query(
        `UPDATE students SET ${fields.join(', ')} WHERE user_id = ?`,
        values
      );
    }

    const profile = await fetchProfileForUser(req.user);
    res.json({
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
};

export const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    const [users] = await pool.query(
      'SELECT id, password FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    const isBcryptHash = typeof user.password === 'string' && user.password.startsWith('$2');
    if (!isBcryptHash) {
      return res.status(500).json({ error: 'Account password is not configured securely. Contact an administrator.' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from the current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: error.message || 'Failed to change password' });
  }
};
