/**
 * Global Theme Configuration
 * Centralized theming system for Bill Buddy app
 */

// Color Palette
export const Colors = {
  // Primary Brand Colors
  primary: "#8B4513", // Brown - main brand color
  primaryLight: "#D4A574", // Light brown
  primaryDark: "#5D2F0A", // Dark brown

  // Secondary Brand Colors (Gold for dark mode)
  secondary: "#D69E2E", // Gold
  secondaryLight: "#F6E05E", // Light gold
  secondaryDark: "#B7791F", // Dark gold

  // Neutral Colors
  white: "#FFFFFF",
  black: "#000000",

  // Gray Scale
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  // Background Colors
  background: {
    light: "#EFE4D2", // Light cream background
    dark: "#1A1A1A", // Dark background
    card: {
      light: "#FFFFFF",
      dark: "#2D3748",
    },
    modal: {
      light: "#FFFFFF",
      dark: "#1A202C",
    },
  },

  // Text Colors
  text: {
    primary: {
      light: "#374151",
      dark: "#FFFFFF",
    },
    secondary: {
      light: "#6B7280",
      dark: "#CBD5E0",
    },
    tertiary: {
      light: "#9CA3AF",
      dark: "#A0AEC0",
    },
    accent: {
      light: "#8B4513",
      dark: "#D69E2E",
    },
  },

  // Status Colors
  success: {
    light: "#10B981",
    dark: "#34D399",
    background: {
      light: "#F1F8E9",
      dark: "#2D4A34",
    },
    border: {
      light: "#C8E6C9",
      dark: "#4CAF50",
    },
  },

  warning: {
    light: "#F59E0B",
    dark: "#FBBF24",
    background: {
      light: "#FEF3C7",
      dark: "#3D3B1F",
    },
    border: {
      light: "#FDE68A",
      dark: "#F59E0B",
    },
  },

  error: {
    light: "#EF4444",
    dark: "#F87171",
    background: {
      light: "#FFF5F5",
      dark: "#4A2D32",
    },
    border: {
      light: "#FFCDD2",
      dark: "#F44336",
    },
  },

  info: {
    light: "#3B82F6",
    dark: "#60A5FA",
    background: {
      light: "#EBF8FF",
      dark: "#1E3A8A",
    },
    border: {
      light: "#93C5FD",
      dark: "#3B82F6",
    },
  },

  // Action Button Colors
  edit: {
    background: {
      light: "#F8F4E8",
      dark: "#3D3D3D",
    },
    border: {
      light: "#D4A574",
      dark: "#D69E2E",
    },
    text: {
      light: "#8B4513",
      dark: "#D69E2E",
    },
  },

  delete: {
    background: {
      light: "#FFF5F5",
      dark: "#4A2D32",
    },
    border: {
      light: "#FFCDD2",
      dark: "#F44336",
    },
    text: {
      light: "#D32F2F",
      dark: "#EF5350",
    },
  },

  duplicate: {
    background: {
      light: "#F1F8E9",
      dark: "#2D4A34",
    },
    border: {
      light: "#C8E6C9",
      dark: "#4CAF50",
    },
    text: {
      light: "#388E3C",
      dark: "#81C784",
    },
  },

  invite: {
    background: {
      light: "#F1F8E9",
      dark: "#2D4A34",
    },
    border: {
      light: "#C8E6C9",
      dark: "#4CAF50",
    },
    text: {
      light: "#388E3C",
      dark: "#81C784",
    },
  },
};

// Typography System
export const Typography = {
  // Font Families
  fontFamily: {
    regular: "System", // iOS: San Francisco, Android: Roboto
    medium: "System",
    bold: "System",
  },

  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 13,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 32,
    "5xl": 36,
  },

  // Font Weights
  fontWeight: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },

  // Text Styles
  textStyles: {
    // Headers
    h1: {
      fontSize: 28,
      fontWeight: "700",
      lineHeight: 34,
    },
    h2: {
      fontSize: 24,
      fontWeight: "600",
      lineHeight: 30,
    },
    h3: {
      fontSize: 20,
      fontWeight: "600",
      lineHeight: 26,
    },
    h4: {
      fontSize: 20,
      fontWeight: "600",
      lineHeight: 24,
    },

    // Body Text
    body: {
      fontSize: 16,
      fontWeight: "400",
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: "400",
      lineHeight: 20,
    },

    // Labels and Captions
    label: {
      fontSize: 14,
      fontWeight: "500",
      lineHeight: 18,
    },
    caption: {
      fontSize: 12,
      fontWeight: "400",
      lineHeight: 16,
    },

    // Button Text
    button: {
      fontSize: 13,
      fontWeight: "500",
      lineHeight: 16,
    },
    buttonLarge: {
      fontSize: 16,
      fontWeight: "600",
      lineHeight: 20,
    },
  },
};

// Spacing System (using 4px base unit)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 32,
  "5xl": 40,
  "6xl": 48,
  "7xl": 56,
  "8xl": 64,
};

// Border Radius System
export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 9999, // For pills/circles
};

// Shadow System
export const Shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  base: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Animation Durations
export const Animation = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 600,
  },
  easing: {
    ease: "ease",
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
  },
};

// Z-Index Scale
export const ZIndex = {
  hide: -1,
  auto: "auto",
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Opacity Scale
export const Opacity = {
  disabled: 0.5,
  pressed: 0.7,
  light: 0.8,
  medium: 0.9,
  full: 1.0,
};

// Icon Sizes
export const IconSizes = {
  xs: 12,
  sm: 16,
  base: 20,
  md: 24,
  lg: 32,
  xl: 48,
  "2xl": 64,
};
