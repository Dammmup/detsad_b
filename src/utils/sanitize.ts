/**
 * Экранирование спецсимволов regex для безопасного использования в MongoDB $regex
 * Предотвращает ReDoS и NoSQL injection через regex-паттерны
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
