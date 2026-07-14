const http = require('http');

const loginOptions = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};

const req = http.request(loginOptions, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const data = JSON.parse(body);
    console.log('Login status:', res.statusCode);
    if (!data.token) {
      console.log('No token:', data);
      return;
    }
    const usersOptions = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/users',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${data.token}` }
    };
    http.request(usersOptions, (res2) => {
      let body2 = '';
      res2.on('data', chunk => body2 += chunk);
      res2.on('end', () => {
        console.log('Users status:', res2.statusCode);
        console.log('Users body:', body2.substring(0, 200));
      });
    }).end();
  });
});
req.write(JSON.stringify({ username: 'pedro', password: '12345' }));
req.end();
