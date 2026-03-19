
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  const apiKey = process.env.EXERCISEDB_API_KEY;
  const apiHost = process.env.EXERCISEDB_API_HOST;
  const baseUrl = process.env.EXERCISEDB_BASE_URL;

  console.log(`API Key: ${apiKey?.substring(0, 5)}...`);
  console.log(`API Host: ${apiHost}`);
  console.log(`Base URL: ${baseUrl}`);

  const client = axios.create({
    baseURL: baseUrl,
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': apiHost,
    },
  });

  try {
    console.log('Testing /exercises/exercise/0001/image...');
    try {
      const resImg = await client.get('/exercises/exercise/0001/image');
      console.log('Image Endpoint Status:', resImg.status);
      console.log('Image Data (first 100 bytes):', resImg.data ? 'present' : 'empty');
    } catch (e: any) {
      console.log('Image Endpoint failed:', e.response?.status || e.message);
    }

    console.log('Testing limit=10, offset=10...');
    const res2 = await client.get('/exercises', { params: { limit: 10, offset: 10 } });
    console.log(`Batch 2: ${res2.data.length} exercises. First: ${res2.data[0]?.name}`);

    if (res1.data[0]?.name !== res2.data[0]?.name) {
        console.log('Offset is working!');
    } else {
        console.log('Offset is NOT working - same data received.');
    }
  } catch (err: any) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data));
    }
  }
}

main();
