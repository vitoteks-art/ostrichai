import fs from 'fs';
import dotenv from 'dotenv';
import FormData from 'form-data';

// Load environment variables
dotenv.config();

const KIE_KEY = process.env.VITE_KIE_API_KEY;
const IMGBB_KEY = process.env.VITE_IMGBB_API_KEY;

if (!KIE_KEY || !IMGBB_KEY) {
    console.error("Missing API keys in .env file");
    process.exit(1);
}

// Mocking the services code
const uploadToImgbb = async (filepath, apiKey) => {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(filepath));

    console.log("Uploading to ImgBB using fetch...");
    // Note: node-fetch or native fetch in Node 18+ needs headers from FormData
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
        // FormData in Node needs headers, but native fetch might handle it if we pass the stream?
        // Actually with 'form-data' package we need to set headers manually
        headers: formData.getHeaders()
    });

    if (!response.ok) {
        throw new Error('Failed to upload image to host');
    }

    const result = await response.json();
    console.log("ImgBB Upload Response:", JSON.stringify(result, null, 2));

    if (!result.success) {
        throw new Error('ImgBB upload failed');
    }

    return result.data.url;
};

const createTask = async (apiKey, imageUrl) => {
    console.log(`Creating Kie.ai task with URL: ${imageUrl}`);
    const payload = {
        input: {
            image: imageUrl.trim()
        },
        callBackUrl: "",
        model: "recraft/remove-background"
    };

    console.log("Kie.ai createTask payload:", JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to create task: ${response.status} ${errorBody}`);
    }

    const result = await response.json();
    console.log("Kie.ai Response:", JSON.stringify(result, null, 2));

    if (result.code !== 200) {
        throw new Error(result.message || "Unknown error creating task");
    }

    return result.data.taskId;
};

async function main() {
    try {
        // Test with proxy
        const failingUrl = "https://i.ibb.co/bRy3gbnR/tura.jpg";
        const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(failingUrl)}`;
        console.log(`Testing createTask with PROXY URL: ${proxyUrl}`);
        await createTask(KIE_KEY, proxyUrl);
        console.log("Success with PROXY URL!");

    } catch (error) {
        console.error("Test failed:", error);
    }
}

main();
