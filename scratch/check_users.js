import '../server/loadEnv.js';
import { getSupabase, isSupabaseEnabled } from '../api/supabase.js';

async function main() {
  console.log('Is Supabase enabled?', isSupabaseEnabled());
  if (!isSupabaseEnabled()) {
    console.log('Supabase is not enabled.');
    return;
  }
  const supabase = getSupabase();
  console.log('Querying users table...');
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Error querying users:', error);
  } else {
    console.log('Users found:', data.length);
    data.forEach(user => {
      console.log(`User: ${user.username}`);
      console.log(`- ID: ${user.id}`);
      console.log(`- Nama: ${user.nama}`);
      console.log(`- Foto length: ${user.foto ? user.foto.length : 'NULL/empty'}`);
      console.log(`- Foto starts with: ${user.foto ? user.foto.substring(0, 30) : 'N/A'}`);
    });
  }
}

main();
