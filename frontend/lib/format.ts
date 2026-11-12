export function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function fmtDate(value?: string | null) {
  if (!value) return '—';
  // Las fechas "YYYY-MM-DD" se leen como locales para evitar desfases de zona horaria
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return date.toLocaleDateString('es', { dateStyle: 'medium' });
}

export function petAge(birthDate?: string | null) {
  if (!birthDate) return '—';
  const born = new Date(`${birthDate.slice(0, 10)}T00:00:00`);
  const now = new Date();
  let months =
    (now.getFullYear() - born.getFullYear()) * 12 +
    (now.getMonth() - born.getMonth());
  if (now.getDate() < born.getDate()) months -= 1;
  if (months < 0) return '—';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} ${rest === 1 ? 'mes' : 'meses'}`;
  return rest === 0
    ? `${years} ${years === 1 ? 'año' : 'años'}`
    : `${years} a ${rest} m`;
}

export function fullName(c?: { firstName: string; lastName: string } | null) {
  return c ? `${c.firstName} ${c.lastName}` : '—';
}
