const axios = require('axios');

const BASE = process.env.BASE_URL || 'http://localhost:3000/api';

async function run() {
  console.log('Sending 3 rapid POST /coins/update requests to test throttle');
  for (let i = 1; i <= 3; i++) {
    try {
      const resp = await axios.post(`${BASE}/coins/update`, null, { timeout: 5000 });
      console.log(i, 'status', resp.status, resp.data);
    } catch (err) {
      if (err.response) {
        console.log(i, 'status', err.response.status, err.response.data || err.response.statusText);
      } else {
        console.log(i, 'error', err.message);
      }
    }
  }
}

run().catch((e) => console.error(e));


