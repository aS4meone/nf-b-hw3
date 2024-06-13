import express, { Request, Response } from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import cron from 'node-cron';

const app = express();
const port = 8000;
let cors = require('cors')

app.use(cors())


app.use(bodyParser.json());

let output: string = 'wait for 00';

const fetchNewsTitles = async (): Promise<string[]> => {
    const url = 'https://www.zakon.kz/api/today-news/?pn=1&pSize=10';
    try {
        const response = await axios.get(url);
        const data = response.data.data_list as Array<{ page_title: string }>;
        return data.map(news => news.page_title);
    } catch (error) {
        console.error('Error fetching news titles:', error);
        throw new Error('Failed to fetch news titles');
    }
};

const summarizeNews = async (): Promise<void> => {
    try {
        console.log("sunm")
        const titles = await fetchNewsTitles();
        const message = titles.join('. ') + '.';

        const replicateUrl = 'https://api.replicate.com/v1/models/meta/llama-2-70b-chat/predictions';
        const replicateBody = {
            input: {
                debug: false,
                top_p: 1,
                prompt: message,
                temperature: 0.5,
                system_prompt: "You are given information in Russian. you answer in English. your task is to summarize the news. you are given the newest news first, then the oldest. analyze them and say what happened in general. First talk about the situation in the country, then a good news story, a neutral news story and the worst news story you are given. Then summarize all the news.",
                max_new_tokens: 500,
                min_new_tokens: -1
            },
            stream: true
        };

        const replicateResponse = await axios.post(replicateUrl, replicateBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer r8_74GelyAl9C7nJMDxTF1pJHTBblKnhNl21xDtk`
            }
        });

        const predictionId = replicateResponse.data.id;
        const predictionResultUrl = `https://api.replicate.com/v1/predictions/${predictionId}`;

        let predictionResult;
        while (!predictionResult || !predictionResult.data.completed_at) {
            await new Promise(resolve => setTimeout(resolve, 1000));  // wait for 1 second
            predictionResult = await axios.get(predictionResultUrl, {
                headers: {
                    'Authorization': `Bearer r8_74GelyAl9C7nJMDxTF1pJHTBblKnhNl21xDtk`  // Replace with your Replicate API token
                }
            });
        }

        output = predictionResult.data.output.join("");
    } catch (error) {
        console.error('Error processing news summary:', error);
    }
};

cron.schedule('0 */3 * * *', summarizeNews);

app.get('/news', async (_req: Request, res: Response) => {
    try {
        const titles = await fetchNewsTitles();
        res.json(titles);
    } catch (error) {
        console.error('Error fetching news titles:', error);
        res.status(500).json({error: 'Failed to fetch news titles'});
    }
});


app.get('/summarized-news', (req: Request, res: Response) => {
    res.json({ output });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
