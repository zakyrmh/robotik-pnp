export const USER_STATUS = ['active', 'banned', 'deleted', 'inactive'] as const;
export type UserStatus = (typeof USER_STATUS)[number];

export const GENDER_TYPE = ['L', 'P'] as const;
export type GenderType = (typeof GENDER_TYPE)[number];