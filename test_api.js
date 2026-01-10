
const fetch = require('node-fetch');

async function testEndpoints() {
    const API_URL = 'https://api.jikan.moe/v4';

    const endpoints = [
        { name: 'Most Popular', url: `${API_URL}/top/anime?filter=bypopularity&limit=5` },
        { name: 'Latest Completed', url: `${API_URL}/anime?status=complete&order_by=end_date&sort=desc&limit=5` },
        { name: 'Most Favorite', url: `${API_URL}/anime?order_by=favorites&sort=desc&limit=5` }
    ];

    for (const endpoint of endpoints) {
        console.log(`Testing ${endpoint.name}: ${endpoint.url}`);
        try {
            const start = Date.now();
            const res = await fetch(endpoint.url);
            const duration = Date.now() - start;
            console.log(`Status: ${res.status} (${duration}ms)`);

            if (res.status === 200) {
                const data = await res.json();
                if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                    console.log(`Success! Found ${data.data.length} items.`);
                    console.log(`First item: ${data.data[0].title}`);
                } else {
                    console.log('Success but no data found or invalid structure.');
                    console.log(JSON.stringify(data).substring(0, 200));
                }
            } else {
                const text = await res.text();
                console.log(`Error body: ${text.substring(0, 200)}`);
            }
        } catch (error) {
            console.error(`Fetch failed: ${error.message}`);
        }
        console.log('-----------------------------------');
        // Wait a bit to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
}

testEndpoints();
