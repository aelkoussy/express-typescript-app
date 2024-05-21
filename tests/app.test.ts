import request from 'supertest';
import express, { Application, Request, Response } from 'express';
import bodyParser from 'body-parser';
import { QuestPayload } from '../src/interfaces';

const app: Application = express();
app.use(bodyParser.json());

const completedQuests = new Set<string>();
const happyWords = ["Joyful", "Happy", "Vibrant", "Thrilled", "Euphoric", "Cheerful", "Delighted"];
const offensiveWords = ["offensiveWord1", "offensiveWord2"];

function containsOffensiveLanguage(text: string): boolean {
    return offensiveWords.some(word => text.includes(word));
}

function computeScore(submissionText: string): number {
    let score = 0;

    if (/[,.?!]/.test(submissionText)) {
        score += 1;
    }

    let joyfulWordCount = 0;
    happyWords.forEach(word => {
        if (submissionText.includes(word) && joyfulWordCount < 3) {
            score += 1;
            joyfulWordCount += 1;
        }
    });

    if (/(.)\1{2,}|(.)(.)\2{2,}/.test(submissionText)) {
        score += 2;
    }

    if (containsOffensiveLanguage(submissionText)) {
        return 0;
    }

    return score;
}

app.post('/submit-quest', (req: Request, res: Response) => {
    const payload: QuestPayload = req.body;

    if (!payload.questId || !payload.userId || !payload.claimed_at || !payload.access_condition || !payload.user_data || !payload.submission_text) {
        return res.status(400).send({ error: 'All fields are required' });
    }

    if (completedQuests.has(payload.questId)) {
        return res.status(200).send({ status: 'fail', score: 0 });
    }

    let accessGranted = true;
    payload.access_condition.forEach(condition => {
        switch (condition.type) {
            case 'discordRole':
                if (condition.operator === 'contains' && !payload.user_data.discordRoles.includes(condition.value)) {
                    accessGranted = false;
                }
                if (condition.operator === 'notContains' && payload.user_data.discordRoles.includes(condition.value)) {
                    accessGranted = false;
                }
                break;
            case 'date':
                const claimedAt = new Date(payload.claimed_at);
                const conditionDate = new Date(condition.value);
                if (condition.operator === '>' && !(claimedAt > conditionDate)) {
                    accessGranted = false;
                }
                if (condition.operator === '<' && !(claimedAt < conditionDate)) {
                    accessGranted = false;
                }
                break;
            case 'level':
                const userLevel = payload.user_data.level;
                const conditionLevel = parseInt(condition.value);
                if (condition.operator === '>' && !(userLevel > conditionLevel)) {
                    accessGranted = false;
                }
                if (condition.operator === '<' && !(userLevel < conditionLevel)) {
                    accessGranted = false;
                }
                break;
            default:
                accessGranted = false;
        }
    });

    if (!accessGranted) {
        return res.status(200).send({ status: 'fail', score: 0 });
    }

    const score = computeScore(payload.submission_text);
    const status = score >= 5 ? 'success' : 'fail';

    if (status === 'success') {
        completedQuests.add(payload.questId);
    }

    res.status(200).send({ status, score });
});

describe('POST /submit-quest', () => {
    beforeEach(() => {
        completedQuests.clear(); // Clear the completed quests before each test
    });

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
                    level: 5
                },
                submission_text: "Lorem ipsum dolor sit amet."
            })
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('fail'); // Score will be 0 due to insufficient joyful words and other conditions
    });

    it('should return 400 for missing fields', async () => {
        const response = await request(app)
            .post('/submit-quest')
            .send({})
            .set('Accept', 'application/json');

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('All fields are required');
    });

    it('should return fail if quest is already completed', async () => {
        completedQuests.add("4569bee2-8f42-4054-b432-68f6ddbc20b5");

        const response = await request(app)
            .post('/submit-quest')
            .send({
                questId: "4569bee2-8f42-4054-b432-68f6ddbc20b5",
                userId: "cb413e98-44a4-4bb1-aaa1-0b91ab1707e7",
                claimed_at: "2023-03-15T10:44:22+0000",
                access_condition: [],
                user_data: {
                    completed_quests: [],
                    discordRoles: [],
                    level: 1
                },
                submission_text: "Lorem ipsum dolor sit amet."
            })
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('fail');
        expect(response.body.score).toBe(0);
    });

    it('should return fail if access conditions are not met', async () => {
        const response = await request(app)
            .post('/submit-quest')
            .send({
                questId: "4569bee2-8f42-4054-b432-68f6ddbc20b5",
                userId: "cb413e98-44a4-4bb1-aaa1-0b91ab1707e7",
                claimed_at: "2023-03-15T10:44:22+0000",
                access_condition: [
                    {
                        type: "level",
                        operator: ">",
                        value: "10"
                    }
                ],
                user_data: {
                    completed_quests: [],
                    discordRoles: [],
                    level: 5
                },
                submission_text: "Lorem ipsum dolor sit amet."
            })
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('fail');
        expect(response.body.score).toBe(0);
    });

    it('should return success if conditions are met and score is sufficient', async () => {
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
                    completed_quests: [],
                    discordRoles: ["1163897602547392553", "1194056197100286162"],
                    level: 5
                },
                submission_text: "Lorem ipsum dolor sit amet abaaba. Joyful, Happy, Euphoric!"
            })
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
        console.log(response.body.score)
        expect(response.body.score).toBeGreaterThanOrEqual(5);
        expect(response.body.status).toBe('success');
    });

    it('should return score 0 if submission_text contains offensive language', async () => {
        const response = await request(app)
            .post('/submit-quest')
            .send({
                questId: "4569bee2-8f42-4054-b432-68f6ddbc20b5",
                userId: "cb413e98-44a4-4bb1-aaa1-0b91ab1707e7",
                claimed_at: "2023-03-15T10:44:22+0000",
                access_condition: [],
                user_data: {
                    completed_quests: [],
                    discordRoles: [],
                    level: 1
                },
                submission_text: "This is an offensiveWord1 text."
            })
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('fail');
        expect(response.body.score).toBe(0);
    });
});
