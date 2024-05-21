import { Request, Response, NextFunction } from 'express';
import { QuestPayload } from '../interfaces';
import { markQuestAsCompleted, isQuestCompleted } from '../services/questService';

/**
 * We could separate the functions here into multiple files too
 * i.e. something like: 
│   ├── middlewares/
│   │   ├── validatePayload.ts
│   │   ├── checkCompletedQuest.ts
│   │   ├── validateAccessConditions.ts
│   │   └── computeScore.ts
 * 
 */

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

export function validateQuest(req: Request, res: Response, next: NextFunction): void {
    const payload: QuestPayload = req.body;

    if (!payload.questId || !payload.userId || !payload.claimed_at || !payload.access_condition || !payload.user_data || !payload.submission_text) {
        res.status(400).send({ error: 'All fields are required' });
    } else if (isQuestCompleted(payload.questId)) {
        res.status(200).send({ status: 'fail', score: 0 });
    } else {
        let accessGranted = true;
        payload.access_condition.forEach((condition) => {
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
            res.status(200).send({ status: 'fail', score: 0 });
        } else {
            const score = computeScore(payload.submission_text);

            if (score >= 5) {
                req.body.status = 'success';
            } else {
                req.body.status = 'fail';
            }
            req.body.score = score;

            next();
        }
    }
}

export function finalizeQuest(req: Request, res: Response): void {
    const { status, score, questId } = req.body;

    if (status === 'success') {
        markQuestAsCompleted(questId);
    }

    res.status(200).send({ status, score });
}
