// Mock Supabase client to avoid breaking imports during migration
// All auth should now go through AuthContext -> apiClient

export const supabase: any = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
    signInWithOAuth: async () => ({ data: null, error: new Error('Supabase OAuth disabled') }),
    signOut: async () => ({ error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        maybeSingle: async () => ({ data: null, error: null }),
        order: () => ({ data: [], error: null }),
      }),
      order: () => ({ data: [], error: null }),
    }),
    insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
    update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) }),
    delete: () => ({ eq: async () => ({ error: null }) }),
  })
};

export const auth = {
  signUp: async (email: string, password: string, userData?: { full_name?: string }) => {
    console.log('Starting signup process for:', email)
    console.log('Supabase client configured:', !!supabase)
    console.log('Supabase URL:', 'MOCKED_URL') // Updated for mock
    console.log('Supabase key configured:', true) // Updated for mock

    try {
      // Use the correct Supabase Auth API format
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      })
      console.log('Signup API call completed:', result)

      // If signup was successful, try to create profile manually as fallback
      if (result.data?.user && !result.error) {
        console.log('Signup successful, ensuring profile creation...')
        const profileResult = await auth.createProfile(
          result.data.user.id,
          email,
          userData?.full_name
        )

        if (profileResult.error) {
          console.warn('Profile creation failed, but signup succeeded:', profileResult.error)
          // Don't fail the signup if profile creation fails - trigger should handle it
        } else {
          console.log('Profile created successfully')
        }
      }

      return result
    } catch (error) {
      console.error('Signup API call failed:', error)
      throw error
    }
  },

  // Helper function to create profile after signup
  createProfile: async (userId: string, email: string, fullName?: string) => {
    try {
      // First, check if profile already exists (in case trigger already created it)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (existingProfile) {
        console.log('Profile already exists, skipping creation')
        return { error: null }
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: fullName || null,
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        return { error: profileError }
      }

      // Check if user_settings already exists
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('id', userId)
        .single()

      if (existingSettings) {
        console.log('User settings already exist, skipping creation')
        return { error: null }
      }

      // Create user settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .insert({
          id: userId,
        })

      if (settingsError) {
        console.error('Error creating user settings:', settingsError)
        return { error: settingsError }
      }

      return { error: null }
    } catch (error) {
      console.error('Unexpected error in createProfile:', error)
      return { error }
    }
  },

  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signOut: () => supabase.auth.signOut(),

  getUser: () => supabase.auth.getUser(),

  onAuthStateChange: (callback: (event: string, session: any) => void) =>
    supabase.auth.onAuthStateChange(callback)
}
