import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabaseUrl = 'https://wmpwqotfncymoswctrqo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtcHdxb3RmbmN5bW9zd2N0cnFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA3MDU0NywiZXhwIjoyMDY3NjQ2NTQ3fQ.AnZemg62B18GctAL8OuzjOcsQqnZ4POvm9cC3xv3rVA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInstagramOAuth() {
  try {
    console.log('Testing Instagram OAuth flow...');

    // Get a Facebook USER access token from existing accounts (not page tokens)
    const { data: fbAccounts, error } = await supabase
      .from('social_media_accounts')
      .select('*')
      .eq('platform', 'facebook')
      .eq('account_type', 'personal')  // Use user token, not page token
      .eq('account_status', 'active')
      .limit(1);

    if (error || !fbAccounts || fbAccounts.length === 0) {
      console.error('No Facebook accounts found to test with');
      return;
    }

    const fbAccount = fbAccounts[0];
    console.log(`Using Facebook account: ${fbAccount.account_name} (${fbAccount.account_type})`);

    // Test the Facebook Graph API to see what pages and Instagram accounts are available
    const accessToken = fbAccount.access_token;
    console.log('Testing Facebook Graph API...');

    // Test 1: Get user pages
    try {
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,picture,instagram_business_account&access_token=${accessToken}`
      );
      const pagesData = await pagesResponse.json();

      console.log('Pages API Response:');
      console.log(JSON.stringify(pagesData, null, 2));

      if (pagesData.data && pagesData.data.length > 0) {
        console.log(`\nFound ${pagesData.data.length} pages:`);

        for (const page of pagesData.data) {
          console.log(`- Page: ${page.name} (${page.id})`);
          console.log(`  Has Instagram linked: ${!!page.instagram_business_account}`);

          if (page.instagram_business_account) {
            const igId = page.instagram_business_account.id;
            console.log(`  Instagram ID: ${igId}`);

            // Test getting Instagram account details
            try {
              const igResponse = await fetch(
                `https://graph.facebook.com/v18.0/${igId}?fields=id,username,name,profile_picture_url&access_token=${accessToken}`
              );
              const igData = await igResponse.json();
              console.log(`  Instagram Details: ${JSON.stringify(igData, null, 2)}`);
            } catch (igError) {
              console.error(`  Error fetching Instagram details: ${igError.message}`);
            }
          }
          console.log('');
        }
      } else {
        console.log('No pages found for this user');
      }
    } catch (pagesError) {
      console.error('Error fetching pages:', pagesError.message);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testInstagramOAuth();