const completedQuests = new Set<string>();

export function markQuestAsCompleted(questId: string): void {
    completedQuests.add(questId);
}

export function isQuestCompleted(questId: string): boolean {
    return completedQuests.has(questId);
}
