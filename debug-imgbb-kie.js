import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const KIE_KEY = process.env.VITE_KIE_API_KEY;
const IMGBB_KEY = process.env.VITE_IMGBB_API_KEY;

if (!KIE_KEY || !IMGBB_KEY) {
    console.error("Missing API keys in .env file");
    process.exit(1);
}

async function createKieTask(imageUrl) {
    console.log(`Creating Kie.ai task with URL: ${imageUrl}`);
    const payload = {
        input: {
            image: imageUrl.trim()
        },
        callBackUrl: "",
        model: "recraft/remove-background"
    };

    try {
        const response = await axios.post('https://api.kie.ai/api/v1/jobs/createTask', payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${KIE_KEY.trim()}`
            }
        });
        console.log("Kie.ai Response:", JSON.stringify(response.data, null, 2));
        return response.data.data.taskId;
    } catch (error) {
        console.error("Kie.ai Task Creation Failed:", error.response ? error.response.data : error.message);
        throw error;
    }
}

async function main() {
    try {
        // Test the specific URL reported by the user
        const failingUrl = "https://i.ibb.co/bRy3gbnR/tura.jpg";
        console.log(`Testing with specific URL: ${failingUrl}`);
        await createKieTask(failingUrl);
    } catch (error) {
        console.error("Test failed");
    }
}

main();
