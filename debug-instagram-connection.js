import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://wmpwqotfncymoswctrqo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtcHdxb3RmbmN5bW9zd2N0cnFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA3MDU0NywiZXhwIjoyMDY3NjQ2NTQ3fQ.AnZemg62B18GctAL8OuzjOcsQqnZ4POvm9cC3xv3rVA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInstagramConnection() {
  try {
    console.log('Checking social media accounts...');

    // Get all social media accounts (using service role key to bypass RLS)
    const { data: accounts, error } = await supabase
      .from('social_media_accounts')
      .select('*')
      .order('connected_at', { ascending: false });

    if (error) {
      console.error('Error fetching accounts:', error);
      return;
    }

    console.log(`Found ${accounts.length} connected accounts:`);

    accounts.forEach((account, index) => {
      console.log(`${index + 1}. Platform: ${account.platform}`);
      console.log(`   Account Name: ${account.account_name || 'N/A'}`);
      console.log(`   Username: ${account.platform_username || 'N/A'}`);
      console.log(`   Status: ${account.account_status}`);
      console.log(`   Account Type: ${account.account_type}`);
      console.log(`   Connected At: ${account.connected_at}`);
      console.log(`   Permissions: ${JSON.stringify(account.permissions, null, 2)}`);
      console.log('---');
    });

    // Check specifically for Instagram accounts
    const instagramAccounts = accounts.filter(acc => acc.platform === 'instagram');
    console.log(`\nInstagram accounts found: ${instagramAccounts.length}`);

    if (instagramAccounts.length === 0) {
      console.log('No Instagram accounts connected. This could be why Instagram is not showing in connected accounts.');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkInstagramConnection();