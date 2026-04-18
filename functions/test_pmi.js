
const axios = require('axios');

const urls = [
    "https://www.pmi.org/-/media/pmi/documents/public/pdf/certifications/pmp-examination-content-outline.pdf",
    "https://www.pmi.org/certifications/project-management-pmp/earn-the-pmp/pmp-exam-preparation/pmp-exam-updates"
];

async function test() {
    for (const url of urls) {
        try {
            console.log(`Testing ${url}...`);
            const res = await axios.get(url, {
                headers: {
                    // Intentionally empty first to see failure
                    'User-Agent': 'axios/1.x'
                },
                validateStatus: () => true
            });
            console.log(`Status: ${res.status}`);

            if (res.status === 403) {
                console.log("Got 403. Retrying with Browser User-Agent...");
                const res2 = await axios.get(url, {
                    headers: {
                        'User-Agent': 'curl/7.64.1',
                        'Accept': '*/*'
                    },
                    validateStatus: () => true
                });
                console.log(`Retry Status: ${res2.status}`);
            }

        } catch (e) {
            console.error("Error:", e.message);
        }
    }
}

test();
