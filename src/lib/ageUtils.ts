export function computeAge(dob: string): string {
  if (!dob) return '';
  const [y, m, d] = dob.split('-').map(Number);
  const birthDate = new Date(y, m - 1, d);
  const now = new Date();
  const totalMonths =
    (now.getFullYear() - birthDate.getFullYear()) * 12 +
    (now.getMonth() - birthDate.getMonth()) -
    (now.getDate() < birthDate.getDate() ? 1 : 0);
  if (totalMonths < 0) return '';
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
  if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
}
