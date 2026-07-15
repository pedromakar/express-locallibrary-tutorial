const http = require('http');

console.log("Testing POST /api/orders locally...");

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function run() {
  try {
    // 1. Register a test user
    const username = 'testorder_' + Math.random().toString(36).substring(7);
    const registerData = JSON.stringify({
      username: username,
      email: `${username}@test.com`,
      password: 'password123'
    });

    console.log(`Registering user ${username}...`);
    const regRes = await makeRequest({
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(registerData)
      }
    }, registerData);

    console.log('Register response:', regRes.statusCode, regRes.body);

    // 2. Login
    const loginData = JSON.stringify({
      username: username,
      password: 'password123'
    });

    console.log('Logging in...');
    const loginRes = await makeRequest({
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, loginData);

    console.log('Login response:', loginRes.statusCode, loginRes.body);
    const token = JSON.parse(loginRes.body).token;

    // 3. Get products
    console.log('Fetching products...');
    const prodRes = await makeRequest({
      hostname: 'localhost',
      port: 5001,
      path: '/api/products',
      method: 'GET'
    });
    
    const products = JSON.parse(prodRes.body);
    if (!products.length) {
      console.error('No products found in DB!');
      return;
    }
    const product = products[0];
    console.log(`Using product: ${product.name} (${product._id})`);

    // 4. Create Order
    const orderData = JSON.stringify({
      items: [{
        productId: product._id,
        quantity: 1,
        size: 'M',
        color: 'Preto'
      }]
    });

    console.log('Creating order...');
    const orderRes = await makeRequest({
      hostname: 'localhost',
      port: 5001,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(orderData),
        'Authorization': `Bearer ${token}`
      }
    }, orderData);

    console.log('Order creation response status:', orderRes.statusCode);
    console.log('Order creation response body:', orderRes.body);

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
