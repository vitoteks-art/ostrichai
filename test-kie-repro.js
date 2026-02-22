const fetch = require('node-fetch'); // Assuming node-fetch is available or using built-in fetch in newer node

const API_KEY = 'b5686f16d6761e7c9c065ce14d270d4b';
const BASE_URL = 'https://api.kie.ai/api/v1/jobs';

const IMGBB_URL = 'https://i.ibb.co/bRy3gbnR/tura.jpg';
const UNSPLASH_URL = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop';

async function testCreateTask(imageUrl, label) {
    console.log(`\nTesting ${label}...`);
    console.log(`URL: ${imageUrl}`);

    const payload = {
        model: "recraft/remove-background",
        callBackUrl: "",
        input: {
            image: imageUrl
        }
    };

    try {
        const response = await fetch(`${BASE_URL}/createTask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${text}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

async function run() {
    await testCreateTask(UNSPLASH_URL, 'Unsplash URL (Known Working)');
    await testCreateTask(IMGBB_URL, 'ImgBB URL (Failing)');
}

run();
