async function testSyntax() {
  const endpoints = [
    '../api/uploads/index.js',
    '../api/uploads/[id].js',
    '../api/messages/index.js',
    '../api/users/index.js',
    '../api/users/[id].js',
    '../api/_db.js',
    '../api/supabase.js'
  ];

  for (const path of endpoints) {
    try {
      console.log(`Attempting to import ${path}...`);
      await import(path);
      console.log(`SUCCESS: Imported ${path} with no syntax errors!`);
    } catch (err) {
      console.error(`SYNTAX ERROR DETECTED in ${path}:`, err.message);
    }
  }
}

testSyntax();
