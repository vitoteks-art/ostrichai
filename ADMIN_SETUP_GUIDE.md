# Admin Dashboard Setup Guide

## 🚀 Quick Start

### Step 1: Run Database Schema

First, execute the admin schema in your Supabase SQL editor:

```sql
-- Copy and paste the contents of admin-schema.sql into your Supabase SQL editor
-- The file is located at: admin-schema.sql
```

### Step 2: Create Your First Super Admin

After running the schema, you need to create your first Super Admin user. Here are the steps:

#### Option A: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
2. **Navigate to Authentication > Users**
3. **Create a new user** or **use an existing user account**
4. **Run this SQL in the SQL Editor** to assign Super Admin role:

```sql
-- Replace 'YOUR_USER_ID' with the actual user ID from the users table
INSERT INTO user_roles (user_id, role, assigned_by, assigned_at)
VALUES (
  'YOUR_USER_ID',
  'super_admin',
  'YOUR_USER_ID',
  NOW()
);
```

#### Option B: Using the Application (After First Login)

1. **Login to your application** with any user account
2. **Access the admin dashboard** at `/admin`
3. **The system will automatically detect** if you need initial setup
4. **Follow the setup wizard** (coming in next update)

### Step 3: Verify Installation

1. **Login with your Super Admin account**
2. **Navigate to `/admin`**
3. **You should see the Admin Dashboard** with:
   - Super Admin badge in the header
   - Full access to all admin features
   - User management capabilities

## 📋 Manual Setup Commands

If you prefer to set up roles manually, here are the SQL commands:

### Create Super Admin Role
```sql
INSERT INTO user_roles (user_id, role, assigned_by, assigned_at)
VALUES ('user-id-here', 'super_admin', 'user-id-here', NOW());
```

### Create Admin Role
```sql
INSERT INTO user_roles (user_id, role, assigned_by, assigned_at)
VALUES ('user-id-here', 'admin', 'super-admin-id-here', NOW());
```

### Create Moderator Role
```sql
INSERT INTO user_roles (user_id, role, assigned_by, assigned_at)
VALUES ('user-id-here', 'moderator', 'admin-id-here', NOW());
```

### Create Viewer Role
```sql
INSERT INTO user_roles (user_id, role, assigned_by, assigned_at)
VALUES ('user-id-here', 'viewer', 'admin-id-here', NOW());
```

## 🔍 Finding User IDs

To find a user's ID in Supabase:

1. **Go to Authentication > Users** in your Supabase dashboard
2. **Click on the user** you want to make an admin
3. **Copy the UUID** from the URL or user details

## 🛠 Troubleshooting

### Common Issues:

**1. "Access Denied" Error**
- Ensure you've assigned the Super Admin role correctly
- Check that the user ID is correct
- Verify the role is properly inserted in the `user_roles` table

**2. "Schema Not Found" Error**
- Make sure you've run the `admin-schema.sql` file in Supabase
- Check that all tables were created successfully

**3. "Permission Denied" for Super Admin**
- Ensure Row Level Security policies are working correctly
- Check that the `is_super_admin()` function works properly

### Verification Queries:

Check if roles are set up correctly:

```sql
-- View all user roles
SELECT
  ur.user_id,
  p.email,
  p.full_name,
  ur.role,
  ur.created_at
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
ORDER BY ur.role, ur.created_at DESC;

-- Check current user's role
SELECT role FROM user_roles WHERE user_id = auth.uid();

-- Check permissions for a role
SELECT * FROM role_permissions WHERE role = 'super_admin';
```

## 🔒 Security Notes

- **Super Admin** has full system access
- **Admin** can manage users and most settings
- **Moderator** has limited administrative access
- **Viewer** has read-only access
- **User** has standard application access

## 🚀 Next Steps

After setting up your admin roles:

1. **Test the admin dashboard** at `/admin`
2. **Create additional admin users** as needed
3. **Set up workflow processes** for your organization
4. **Configure system settings** and alerts
5. **Set up regular data exports** for compliance

## 📞 Support

If you encounter issues:

1. **Check the browser console** for error messages
2. **Verify database permissions** in Supabase
3. **Ensure all schema changes** were applied correctly
4. **Check user role assignments** in the database

The admin dashboard is now ready for production use! 🎉