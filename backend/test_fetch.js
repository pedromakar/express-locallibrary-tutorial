const http = require('http');

console.log("Testing API fetch calls locally on port 5001...");

const endpoints = [
  '/api/products',
  '/api/auth/me', // should be 401
];

function fetchEndpoint(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:5001${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Endpoint ${path}: Status = ${res.statusCode}`);
        try {
          const parsed = JSON.parse(data);
          console.log(`  Response Type: ${Array.isArray(parsed) ? 'Array' : 'Object'}`);
          if (Array.isArray(parsed)) {
            console.log(`  Count: ${parsed.length}`);
          } else {
            console.log(`  Keys:`, Object.keys(parsed));
          }
        } catch (e) {
          console.log(`  Failed to parse JSON:`, data.substring(0, 100));
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log(`Endpoint ${path}: Connection Error: ${err.message}`);
      resolve();
    });
  });
}

async function run() {
  for (const ep of endpoints) {
    await fetchEndpoint(ep);
  }
}

run();
