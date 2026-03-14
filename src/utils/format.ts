/**
 * Returns a CSS color variable or hex code based on the percentage score.
 * - 80% and above -> green (success)
 * - 50% to 79% -> yellow/orange (warning)
 * - below 50% -> red (danger)
 */
export function getScoreColor(percentage: number): string {
  if (percentage >= 80) return 'var(--success)';
  if (percentage >= 50) return '#f59e0b'; // Amber/Yellow-orange
  return 'var(--danger)';
}

/**
 * Returns a descriptive status label in Arabic based on the score.
 */
export function getScoreStatus(percentage: number): string {
  if (percentage >= 80) return 'ممتاز';
  if (percentage >= 50) return 'جيد';
  return 'تحتاج تحسين';
}
