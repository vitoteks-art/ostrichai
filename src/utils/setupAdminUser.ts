/**
 * Admin User Setup Utility
 *
 * This utility helps you create your first Super Admin user
 * Run this in the browser console or as a script after login
 */

import { supabase } from '../lib/supabase';

export interface SetupAdminOptions {
  userId: string;
  role?: 'super_admin' | 'admin' | 'moderator' | 'viewer';
  skipIfExists?: boolean;
}

/**
 * Setup initial admin user
 */
export async function setupAdminUser(options: SetupAdminOptions): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  try {
    const { userId, role = 'super_admin', skipIfExists = true } = options;

    // Check if user already has a role
    if (skipIfExists) {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        return {
          success: true,
          message: `User already has role: ${existingRole.role}`,
          data: existingRole,
        };
      }
    }

    // Insert new role
    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role,
        assigned_by: userId, // Self-assigned for initial setup
        assigned_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating admin role:', error);
      return {
        success: false,
        message: `Failed to create ${role} role: ${error.message}`,
      };
    }

    return {
      success: true,
      message: `Successfully created ${role} role for user`,
      data,
    };
  } catch (error: any) {
    console.error('Setup error:', error);
    return {
      success: false,
      message: `Setup failed: ${error.message}`,
    };
  }
}

/**
 * Get current user's ID (for easy copying)
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Quick setup function - call this in browser console
 */
export async function quickSetup(): Promise<void> {
  console.log('🚀 Starting Admin Setup...');

  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('❌ No authenticated user found. Please login first.');
    return;
  }

  console.log(`👤 Current User ID: ${userId}`);
  console.log('📋 Copy this ID to use in setup');

  // Ask user what role they want
  const role = prompt('Enter role (super_admin, admin, moderator, viewer):', 'super_admin') as SetupAdminOptions['role'];

  if (!role || !['super_admin', 'admin', 'moderator', 'viewer'].includes(role)) {
    console.error('❌ Invalid role. Please choose: super_admin, admin, moderator, or viewer');
    return;
  }

  const result = await setupAdminUser({ userId, role });

  if (result.success) {
    console.log('✅ Success:', result.message);
    console.log('🎉 You can now access the admin dashboard at /admin');
  } else {
    console.error('❌ Failed:', result.message);
  }
}

/**
 * Helper function to display setup instructions
 */
export function showSetupInstructions(): void {
  console.log(`
🔧 ADMIN DASHBOARD SETUP INSTRUCTIONS:

1. 📋 Copy your User ID from above
2. 🗃️  Run the admin-schema.sql in your Supabase SQL editor
3. 🔑 Login to your application
4. 🕹️  Run this in the browser console: quickSetup()
5. 🎉 Access your admin dashboard at /admin

Alternatively, run this SQL manually in Supabase:

INSERT INTO user_roles (user_id, role, assigned_by, assigned_at)
VALUES ('YOUR_USER_ID_HERE', 'super_admin', 'YOUR_USER_ID_HERE', NOW());

Need help? Check the ADMIN_SETUP_GUIDE.md file.
  `);
}

// Auto-show instructions when this file is loaded
if (typeof window !== 'undefined') {
  console.log('🔧 Admin Setup Utility Loaded');
  showSetupInstructions();
}

// Export for use in other scripts
export default {
  setupAdminUser,
  getCurrentUserId,
  quickSetup,
  showSetupInstructions,
};
