// ─── String Utilities ────────────────────────────────────────────────────────

export const StringUtils = {
  capitalize: (str: string): string =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(),

  titleCase: (str: string): string =>
    str.replace(/\w\S*/g, txt => StringUtils.capitalize(txt)),

  truncate: (str: string, maxLength: number, suffix = '...'): string =>
    str.length > maxLength ? str.slice(0, maxLength - suffix.length) + suffix : str,

  maskMobile: (mobile: string): string =>
    mobile.replace(/(\d{2})\d{6}(\d{2})/, '$1xxxxxx$2'),

  maskEmail: (email: string): string => {
    const [user, domain] = email.split('@');
    return `${user.slice(0, 2)}****@${domain}`;
  },

  generateRoomCode: (length = 6): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () =>
      chars[Math.floor(Math.random() * chars.length)],
    ).join('');
  },

  pluralize: (count: number, singular: string, plural?: string): string =>
    count === 1 ? singular : (plural ?? `${singular}s`),

  getInitials: (name: string): string =>
    name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase(),
};
