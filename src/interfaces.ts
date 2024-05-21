export interface AccessCondition {
    type: 'discordRole' | 'date' | 'level';
    operator: 'contains' | 'notContains' | '>' | '<';
    value: string;
}

export interface UserData {
    completed_quests: string[];
    discordRoles: string[];
    level: number;
}

export interface QuestPayload {
    questId: string;
    userId: string;
    claimed_at: string;
    access_condition: AccessCondition[];
    user_data: UserData;
    submission_text: string;
}
