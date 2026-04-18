const https = require('https');
const fs = require('fs');

const apiKey = "AIzaSyDr6n3PfD9Th6BeeEmywRkdTDd1rwOna5I";

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models?key=${apiKey}`,
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        fs.writeFileSync('models.json', body);
        console.log('Models saved to models.json');
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.end();
