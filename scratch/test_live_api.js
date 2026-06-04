async function testLive() {
  const url = 'https://proclaim-check.vercel.app/api/riwayat';
  console.log('Fetching live API:', url);
  try {
    const res = await fetch(url);
    console.log('Status Code:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    const text = await res.text();
    console.log('Response body:', text.slice(0, 1000));
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

testLive();
