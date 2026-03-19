import axios from 'axios';

async function testWger(name: string) {
  console.log(`Searching Wger for: ${name}`);
  try {
    const url = `https://wger.de/api/v2/exerciseinfo/?name=${encodeURIComponent(name)}&language=2`;
    const { data } = await axios.get(url);
    console.log(`Wger Results for "${name}":`, data.results?.length || 0);
    if (data.results && data.results.length > 0) {
      for (const res of data.results) {
        if (res.images && res.images.length > 0) {
          console.log(`FOUND IMAGES! Result name: ${res.name}`);
          console.log(`Image URL: ${res.images[0].image}`);
          return;
        }
      }
      console.log('No images found in any results.');
    }
  } catch (e: any) {
    console.error('Wger API failed:', e.message);
  }
}

const exerciseToTest = process.argv[2] || 'Bench Press';
testWger(exerciseToTest);
