const http = require('http');

console.log("Simulating admin login and API fetches on port 5001...");

const loginData = JSON.stringify({
  username: 'pedro',
  password: '12345'
});

const reqOptions = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const req = http.request(reqOptions, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', async () => {
    console.log(`Login Status: ${res.statusCode}`);
    try {
      const data = JSON.parse(body);
      const token = data.token;
      if (!token) {
        console.log("No token received! Details:", data);
        return;
      }
      console.log("Token received successfully. Fetching admin endpoints...");
      
      await fetchWithToken('/api/admin/stats', token);
      await fetchWithToken('/api/products', token);
      await fetchWithToken('/api/users', token);
      await fetchWithToken('/api/admin/orders', token);
      await fetchWithToken('/api/admin/carts', token);
      await fetchWithToken('/api/admin/notifications', token);
      await fetchWithToken('/api/admin/reports', token);
      
    } catch (e) {
      console.log("Login JSON Parse Error:", e.message, body);
    }
  });
});

req.on('error', (e) => {
  console.error("Login Connection Error:", e.message);
});

req.write(loginData);
req.end();

function fetchWithToken(path, token) {
  return new Promise((resolve) => {
    const opts = {
      hostname: 'localhost',
      port: 5001,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    http.get(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`Endpoint ${path}: Status = ${res.statusCode}`);
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            console.log(`  Type: Array, Count = ${parsed.length}`);
          } else {
            console.log(`  Type: Object, Keys =`, Object.keys(parsed));
          }
        } catch (e) {
          console.log(`  Failed to parse JSON:`, data.substring(0, 100));
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log(`Endpoint ${path}: Error = ${err.message}`);
      resolve();
    });
  });
}
