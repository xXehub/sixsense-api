// Admin Configuration
// Add Discord IDs of admins here

export const ADMIN_DISCORD_IDS = [
  '348249431101145099', // Main admin - ganti dengan Discord ID kamu
  // Tambahkan admin lain di sini
];

export const isAdmin = (discordId: string | undefined): boolean => {
  if (!discordId) return false;
  return ADMIN_DISCORD_IDS.includes(discordId);
};

// Admin roles untuk granular permissions (optional)
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const;

export const ADMIN_PERMISSIONS = {
  [ADMIN_ROLES.SUPER_ADMIN]: ['*'], // All permissions
  [ADMIN_ROLES.ADMIN]: ['keys:*', 'users:read', 'users:ban', 'games:*', 'stats:read'],
  [ADMIN_ROLES.MODERATOR]: ['keys:read', 'users:read', 'stats:read'],
};
