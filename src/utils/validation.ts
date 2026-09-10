// ─── Validation Utilities ────────────────────────────────────────────────────

export const Validation = {
  isMobile: (value: string): boolean => /^[6-9]\d{9}$/.test(value.trim()),

  isEmail: (value: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),

  isPasswordStrong: (value: string): boolean =>
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value),

  isOTP: (value: string, length = 6): boolean =>
    new RegExp(`^\\d{${length}}$`).test(value),

  isUsername: (value: string): boolean =>
    /^[a-zA-Z0-9_]{3,20}$/.test(value),

  isReferralCode: (value: string): boolean =>
    /^[A-Z0-9]{6,10}$/.test(value.toUpperCase()),

  isEmpty: (value: string | null | undefined): boolean =>
    !value || value.trim().length === 0,

  getPasswordStrength: (value: string): 'weak' | 'medium' | 'strong' => {
    if (value.length < 6) return 'weak';
    if (Validation.isPasswordStrong(value)) return 'strong';
    return 'medium';
  },
};
