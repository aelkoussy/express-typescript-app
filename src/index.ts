import express, { Application, Request, Response } from 'express';
import bodyParser from 'body-parser';
import { QuestPayload } from './interfaces';

const app: Application = express();
const port = 3000;

app.use(bodyParser.json());

const completedQuests = new Set<string>(); // To store completed quests

const happyWords = ["Joyful", "Happy", "Vibrant", "Thrilled", "Euphoric", "Cheerful", "Delighted"];
const offensiveWords = ["offensiveWord1", "offensiveWord2"]; // Extend this list as needed

function containsOffensiveLanguage(text: string): boolean {
    return offensiveWords.some(word => text.includes(word));
}

function computeScore(submissionText: string): number {
    let score = 0;

    // Check for punctuation
    if (/[,.?!]/.test(submissionText)) {
        score += 1;
    }

    // Check for joyful words
    let joyfulWordCount = 0;
    happyWords.forEach(word => {
        if (submissionText.includes(word) && joyfulWordCount < 3) {
            score += 1;
            joyfulWordCount += 1;
        }
    });

    // Check for repetitive sequences
    if (/(.)\1{2,}|(.)(.)\2{2,}/.test(submissionText)) {
        score += 2;
    }

    // Check for offensive language
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

    // Check if the quest is already completed
    if (completedQuests.has(payload.questId)) {
        return res.status(200).send({ status: 'fail', score: 0 });
    }

    // Validate access conditions
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

    // Compute the score
    const score = computeScore(payload.submission_text);

    // Determine the status
    const status = score >= 5 ? 'success' : 'fail';

    // Mark quest as completed
    if (status === 'success') {
        completedQuests.add(payload.questId);
    }

    res.status(200).send({ status, score });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
