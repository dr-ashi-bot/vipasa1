export const COLORS = {
  primary: '#6C63FF',
  primaryDark: '#5A52D5',
  primaryLight: '#8B85FF',
  secondary: '#FF6584',
  accent: '#FFD93D',
  success: '#4CAF50',
  error: '#FF5252',
  warning: '#FFC107',

  background: '#F8F9FE',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',

  text: '#2D3436',
  textSecondary: '#636E72',
  textLight: '#B2BEC3',
  textOnPrimary: '#FFFFFF',

  streak: '#FF9800',
  xp: '#FFD700',

  // League colors
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  sapphire: '#0F52BA',
  ruby: '#E0115F',
  emerald: '#50C878',
  amethyst: '#9966CC',
  pearl: '#F0EAD6',
  obsidian: '#3D3635',
  diamond: '#B9F2FF',

  // Zones
  promotionZone: '#E8F5E9',
  safeZone: '#FFFFFF',
  demotionZone: '#FFEBEE',

  border: '#E0E0E0',
  divider: '#F0F0F0',
  shadow: 'rgba(0,0,0,0.1)',
};

export const FONTS = {
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.text,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: COLORS.text,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: COLORS.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: COLORS.textLight,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.textOnPrimary,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const LEAGUE_COLORS: Record<string, string> = {
  Bronze: COLORS.bronze,
  Silver: COLORS.silver,
  Gold: COLORS.gold,
  Sapphire: COLORS.sapphire,
  Ruby: COLORS.ruby,
  Emerald: COLORS.emerald,
  Amethyst: COLORS.amethyst,
  Pearl: COLORS.pearl,
  Obsidian: COLORS.obsidian,
  Diamond: COLORS.diamond,
};
