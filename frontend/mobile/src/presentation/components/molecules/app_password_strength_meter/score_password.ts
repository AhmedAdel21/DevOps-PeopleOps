export type AppPasswordStrength = 0 | 1 | 2 | 3 | 4;

export interface AppPasswordScore {
    score: AppPasswordStrength;
    /** i18n key under auth.setPassword.strength.* */
    labelKey: 'empty' | 'weak' | 'fair' | 'good' | 'strong';
}

/**
 * Pure password strength scorer. Adds one point per satisfied rule,
 * capped at 4. Rules: length ≥ 8, uppercase, number, symbol.
 *
 * Empty string → score 0, label 'empty'.
 */
export const scorePassword = (password: string): AppPasswordScore => {
    if (!password) return { score: 0, labelKey: 'empty' };

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    const labelKey: AppPasswordScore['labelKey'] =
        score <= 1 ? 'weak' : score === 2 ? 'fair' : score === 3 ? 'good' : 'strong';

    return { score: score as AppPasswordStrength, labelKey };
};