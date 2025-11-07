// Color Theme for Medical Records App - Teal Blue Healthcare Theme (Enhanced Visibility)
export const colors = {
  // Primary colors - Teal Blue (Trust, Health, Professionalism) - Enhanced Contrast
  primary: '#0D9488',        // Darker teal blue - main brand color (better visibility)
  primaryDark: '#0F766E',   // Even darker teal for depth
  primaryLight: '#14B8A6',  // Lighter teal for highlights
  
  // Secondary colors - Ocean Blue (Stability, Reliability) - Enhanced Contrast
  secondary: '#0E7490',      // Darker ocean blue - for secondary actions (better visibility)
  secondaryDark: '#155E75',
  secondaryLight: '#0891B2',
  
  // Accent colors - Soft Cyan (Fresh, Modern) - Enhanced Contrast
  accent: '#06B6D4',         // Deeper cyan - for accents (better visibility)
  accentDark: '#0891B2',
  accentLight: '#22D3EE',
  
  // Status colors - Clear and Accessible with High Contrast
  success: '#059669',        // Darker emerald green for success (better visibility)
  warning: '#D97706',        // Darker amber for warnings (better visibility)
  error: '#DC2626',          // Darker red for errors (better visibility, critical)
  info: '#0D9488',          // Teal for info (same as primary)
  
  // Background colors - Clean and High Contrast
  background: '#FFFFFF',     // Pure white background (maximum contrast)
  surface: '#FFFFFF',        // Pure white for cards/surfaces (clean, medical)
  surfaceVariant: '#F0FDFA',  // Very light teal tint for subtle variations
  
  // Text colors - High Contrast for Excellent Readability
  textPrimary: '#0F172A',    // Almost black - main text (maximum readability, WCAG AAA)
  textSecondary: '#475569',  // Dark slate - secondary text (high contrast)
  textDisabled: '#94A3B8',  // Medium slate - disabled text (clear distinction)
  textOnPrimary: '#FFFFFF',  // White text on primary color (high contrast)
  textOnSecondary: '#FFFFFF', // White text on secondary color (high contrast)
  
  // Border and divider - Clear and Visible
  border: '#CBD5E1',         // Medium gray borders (clear visibility)
  divider: '#94A3B8',       // Medium slate dividers (clear separation)
  
  // Medical record specific - Clear Visual Distinction with High Contrast
  prescription: '#0D9488',   // Darker teal for prescriptions (better visibility)
  labReport: '#059669',     // Darker emerald green for lab reports (better visibility)
  scan: '#0891B2',          // Ocean blue for scans (better visibility)
  other: '#64748B',         // Slate gray for other types (clear distinction)
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  body: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  bodySmall: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    color: colors.textSecondary,
  },
};

export const getDocumentTypeColor = (type) => {
  const colorMap = {
    PRESCRIPTION: colors.prescription,
    LAB_REPORT: colors.labReport,
    SCAN: colors.scan,
    OTHER: colors.other,
  };
  return colorMap[type] || colors.other;
};

