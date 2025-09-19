// src/utils/dateUtils.ts

export const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const created = new Date(dateString);
  const diffInMs = now.getTime() - created.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);

  if (diffInMinutes < 1) return 'À l\'instant';
  if (diffInMinutes < 60) return `${diffInMinutes} min`;
  if (diffInHours < 24) return `${diffInHours} h`;
  if (diffInDays < 7) return `${diffInDays} j`;
  if (diffInWeeks < 4) return `${diffInWeeks} sem.`;
  return created.toLocaleDateString('fr-FR');
};