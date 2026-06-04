import '../server/loadEnv.js';
import { getSupabase, isSupabaseEnabled } from '../api/supabase.js';

async function main() {
  console.log('Is Supabase enabled?', isSupabaseEnabled());
  if (!isSupabaseEnabled()) {
    console.log('Supabase is not enabled.');
    return;
  }
  const supabase = getSupabase();
  console.log('Updating user tabita with a real base64 mock photo...');
  
  const testBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(5000); // 5KB mock image
  
  const { data, error } = await supabase
    .from('users')
    .update({ foto: testBase64 })
    .eq('id', '1')
    .select();
    
  if (error) {
    console.error('Error updating user photo:', error);
  } else {
    console.log('Update success!', data);
  }
}

main();
