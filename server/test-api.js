import http from 'http';

const loginReq = http.request(
    { hostname: 'localhost', port: 5001, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
             const token = JSON.parse(body).accessToken;
             const facReq = http.request(
                 { hostname: 'localhost', port: 5001, path: '/api/faculty', method: 'GET', headers: { 'Authorization': `Bearer ${token}` } },
                 facRes => {
                      let facBody = '';
                      facRes.on('data', chunk => facBody += chunk);
                      facRes.on('end', () => console.log('Faculty API Response:', facBody));
                 }
             );
             facReq.end();
        });
    }
);
loginReq.write(JSON.stringify({ username: 'admin', password: 'admin123' }));
loginReq.end();
