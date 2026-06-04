async function check() {
  const r = await fetch('https://proclaim-check.vercel.app/api/uploads');
  const uploads = await r.json();
  const puskesmasList = [
    'Mulia Hati 1', 'Mulia Hati 2',
    'Budi Mulia 1', 'Budi Mulia 2',
    'Harapan Kasih 1', 'Harapan Kasih 2',
    'Sentosa 1', 'Sentosa 2',
    'Citra Medika 1', 'Citra Medika 2',
    'Sehat Mandiri 1', 'Sehat Mandiri 2'
  ];
  
  console.log('=== UPLOAD COUNTS PER PUSKESMAS FOR 2024 ===');
  puskesmasList.forEach(p => {
    const c = uploads.filter(u => u.puskesmas === p && u.year === '2024').length;
    console.log(`${p}: ${c} docs (Expected 168)`);
  });
  
  console.log('\n=== UPLOAD COUNTS PER PUSKESMAS FOR 2025 ===');
  puskesmasList.forEach(p => {
    const c = uploads.filter(u => u.puskesmas === p && u.year === '2025').length;
    console.log(`${p}: ${c} docs (Expected 168)`);
  });
}

check();
