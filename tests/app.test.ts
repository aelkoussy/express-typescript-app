import request from 'supertest';
import express, { Application, Request, Response } from 'express';
import bodyParser from 'body-parser';

const app: Application = express();
app.use(bodyParser.json());

// Your endpoint
app.post('/submit-quest', (req: Request, res: Response) => {
    const payload = req.body;

    if (!payload.questId || !payload.userId || !payload.claimed_at || !payload.access_condition || !payload.user_data || !payload.submission_text) {
        return res.status(400).send({ error: 'All fields are required' });
    }

    res.status(200).send({ message: 'Quest submission received successfully!', payload });
});

describe('POST /submit-quest', () => {
    it('should return 200 and success message for valid payload', async () => {
        const response = await request(app)
            .post('/submit-quest')
            .send({
                questId: "4569bee2-8f42-4054-b432-68f6ddbc20b5",
                userId: "cb413e98-44a4-4bb1-aaa1-0b91ab1707e7",
                claimed_at: "2023-03-15T10:44:22+0000",
                access_condition: [
                    {
                        type: "discordRole",
                        operator: "contains",
                        value: "1163897602547392553"
                    },
                    {
                        type: "date",
                        value: "2023-02-15T10:44:22+0000",
                        operator: ">"
                    },
                    {
                        type: "level",
                        value: "4",
                        operator: ">"
                    }
                ],
                user_data: {
                    completed_quests: [
                        "94e2e33e-07e9-4750-8cea-c033d7706057"
                    ],
                    discordRoles: ["1163897602547392553", "1194056197100286162"],
                    level: 3
                },
                submission_text: "Lorem ipsum dolor sit amet."
            })
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Quest submission received successfully!');
    });

    it('should return 400 for invalid payload', async () => {
        const response = await request(app)
            .post('/submit-quest')
            .send({})
            .set('Accept', 'application/json');

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('All fields are required');
    });
});
