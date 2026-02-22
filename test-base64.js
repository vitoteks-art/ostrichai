const fetch = require('node-fetch');

const API_KEY = 'b5686f16d6761e7c9c065ce14d270d4b';
const BASE_URL = 'https://api.kie.ai/api/v1/jobs';

// A small 1x1 red dot base64 jpeg
const BASE64_IMAGE = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

async function testBase64() {
    console.log('Testing Base64 payload...');

    const payload = {
        model: "recraft/remove-background",
        callBackUrl: "",
        input: {
            image: BASE64_IMAGE
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

testBase64();
