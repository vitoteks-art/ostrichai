import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const IMGBB_KEY = process.env.VITE_IMGBB_API_KEY;

if (!IMGBB_KEY) {
    console.error("Missing API keys in .env file");
    process.exit(1);
}

const TEST_IMAGE_URL = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop";
const TEMP_IMAGE_PATH = 'temp_test_image_response.jpg';

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

async function uploadToImgbb(filepath) {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(filepath));

    try {
        console.log("Uploading to ImgBB...");
        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });
        console.log("FULL ImgBB Response:", JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error("ImgBB Upload Failed:", error.response ? error.response.data : error.message);
        throw error;
    }
}

async function main() {
    try {
        console.log("Downloading test image...");
        await downloadImage(TEST_IMAGE_URL, TEMP_IMAGE_PATH);

        await uploadToImgbb(TEMP_IMAGE_PATH);

        // Cleanup
        if (fs.existsSync(TEMP_IMAGE_PATH)) {
            fs.unlinkSync(TEMP_IMAGE_PATH);
        }
    } catch (error) {
        console.error("Test failed");
    }
}

main();
