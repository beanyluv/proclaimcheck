async function analyze() {
  const r = await fetch('https://proclaim-check.vercel.app/api/uploads');
  const uploads = await r.json();
  
  const years = ['2025', '2026'];
  const pList = ['Mulia Hati 1', 'Mulia Hati 2', 'Budi Mulia 1'];
  
  years.forEach(year => {
    console.log(`\n================ YEAR ${year} ================`);
    pList.forEach(p => {
      console.log(`\nPuskesmas: ${p}`);
      const docs = uploads.filter(u => u.puskesmas === p && u.year === year);
      
      // Group by month
      const byMonth = {};
      docs.forEach(d => {
        if (!byMonth[d.month]) byMonth[d.month] = [];
        byMonth[d.month].push(d);
      });
      
      Object.keys(byMonth).forEach(month => {
        const mDocs = byMonth[month];
        const total = mDocs.length;
        const layak = mDocs.filter(d => d.status === 'Layak').length;
        const pending = mDocs.filter(d => d.status === 'Pending').length;
        const mr = mDocs.filter(d => d.status === 'Menunggu Review').length;
        const tl = mDocs.filter(d => d.status === 'Tidak Layak').length;
        
        console.log(`  Month: ${month.padEnd(10)} | Total: ${total} | Layak: ${layak} | Pending: ${pending} | Menunggu: ${mr} | Tidak Layak: ${tl}`);
      });
    });
  });
}

analyze();
