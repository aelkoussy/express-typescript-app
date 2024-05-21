import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { QuestPayload } from './interfaces';

const app = express();
const port = 3000;

app.use(bodyParser.json());

// GET endpoint
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});

// POST endpoint
app.post('/submit-quest', (req: Request, res: Response) => {
    const payload: QuestPayload = req.body;

    // Basic validation
    if (!payload.questId || !payload.userId || !payload.claimed_at || !payload.access_condition || !payload.user_data || !payload.submission_text) {
        return res.status(400).send({ error: 'All fields are required' });
    }

    // Additional validation can be added here (e.g., checking if UUIDs are valid, date format is correct, etc.)

    res.status(200).send({ message: 'Quest submission received successfully!', payload });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
