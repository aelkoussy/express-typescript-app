import { Request, Response } from 'express';
import { markQuestAsCompleted } from '../services/questService';

export function submitQuest(req: Request, res: Response): void {
    const { status, score, questId } = req.body;

    if (status === 'success') {
        markQuestAsCompleted(questId);
    }

    res.status(200).send({ status, score });
}
