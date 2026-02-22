import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const KIE_KEY = process.env.VITE_KIE_API_KEY;

if (!KIE_KEY) {
    console.error("Missing VITE_KIE_API_KEY in .env file");
    process.exit(1);
}

const TEST_IMAGE_URL = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop";
const TEMP_IMAGE_PATH = 'temp_test_image_fileio.jpg';

async function downloadImage(url, filepath) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function uploadToFileIo(filepath) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filepath));

    try {
        console.log("Uploading to file.io...");
        const response = await axios.post('https://file.io', formData, {
            headers: {
                ...formData.getHeaders()
            }
        });
        console.log("file.io Response Data:", JSON.stringify(response.data, null, 2));
        if (response.data.success) {
            return response.data.link;
        } else {
            throw new Error('file.io upload failed');
        }
    } catch (error) {
        console.error("file.io Upload Failed:", error.response ? error.response.data : error.message);
        throw error;
    }
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
        console.log("Downloading test image...");
        await downloadImage(TEST_IMAGE_URL, TEMP_IMAGE_PATH);

        const fileIoUrl = await uploadToFileIo(TEMP_IMAGE_PATH);
        console.log(`Image uploaded to file.io: ${fileIoUrl}`);

        await createKieTask(fileIoUrl);

        // Cleanup
        if (fs.existsSync(TEMP_IMAGE_PATH)) {
            fs.unlinkSync(TEMP_IMAGE_PATH);
        }
    } catch (error) {
        console.error("Test failed");
    }
}

main();
