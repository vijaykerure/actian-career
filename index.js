import express from 'express';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const app = express();
const PORT = process.env.PORT || 3000;
const CAREERS_URL = 'https://www.actian.com/company/careers';

const HttpStatusCodes = {
    OK: 200,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
}

app.get('/open-positions', async (req, res) => {
    const { department } = req.query;

    if (!department) {
        return res.status(HttpStatusCodes.BAD_REQUEST).json({ error: 'Department is required!' });
    }

    try {
        // Load html content from careers page
        const response = await fetch(CAREERS_URL);

        // Parse html
        const html = await response.text();
        const $ = cheerio.load(html);

        // Get all the deparments with postions
        const departmentsWithJobPositions = $('.open-positions .accordion-item').map((_, element) => {
            const departmentName = $(element).find('.category-name').text().trim().toLowerCase();
            const numberOfPositions = $(element).find('.number-of-positions').text().trim();
            // Find jobs and location
            const jobs = $(element).find('.listing').map((_, listing) => ({
                name: $(listing).find('.job-name').text().trim(),
                location: $(listing).find('.job-position').text().trim()
            })).get();
            return { department: departmentName, positions: numberOfPositions, jobs };
        }).get();

        // Find quried deparment have positions
        const openPositions = departmentsWithJobPositions.find(dp => dp.department === department.toLowerCase());
        
        if(!openPositions || !Object.keys(openPositions).length) {
            return res.status(HttpStatusCodes.NOT_FOUND).json({ error: 'No department found!' });
        }
        res.json({ ...openPositions });
    } catch (error) {
        console.error('Error:', error);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
