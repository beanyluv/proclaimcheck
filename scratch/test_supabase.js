import '../server/loadEnv.js';
import { getSupabase, isSupabaseEnabled } from '../api/supabase.js';

async function main() {
  console.log('Is Supabase enabled?', isSupabaseEnabled());
  if (!isSupabaseEnabled()) {
    console.log('Supabase is not enabled.');
    return;
  }
  const supabase = getSupabase();
  console.log('Querying riwayat table...');
  const { data, error } = await supabase.from('riwayat').select('*').limit(5);
  if (error) {
    console.error('Error querying riwayat:', error);
  } else {
    console.log('Riwayat query success:', data);
  }
}

main();
