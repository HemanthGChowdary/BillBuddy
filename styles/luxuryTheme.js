/**
 * Luxury Design System for BillBuddy
 * Premium App Store Ready Theme
 */

// Premium Color Palette
export const LuxuryColors = {
  // Premium Brand Colors - Sophisticated and Modern
  primary: {
    50: "#F8FAFC",
    100: "#F1F5F9", 
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B", // Main brand color - sophisticated slate
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A"
  },

  // Accent Colors - Premium Gold/Bronze
  accent: {
    50: "#FFFBEB",
    100: "#FEF3C7", 
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B", // Primary accent - rich amber
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F"
  },

  // Success - Emerald Green
  success: {
    50: "#ECFDF5",
    100: "#D1FAE5",
    200: "#A7F3D0",
    300: "#6EE7B7",
    400: "#34D399",
    500: "#10B981",
    600: "#059669",
    700: "#047857",
    800: "#065F46",
    900: "#064E3B"
  },

  // Error - Modern Red
  error: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444",
    600: "#DC2626",
    700: "#B91C1C",
    800: "#991B1B",
    900: "#7F1D1D"
  },

  // Warning - Vibrant Orange
  warning: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FED7AA",
    300: "#FDBA74",
    400: "#FB923C",
    500: "#F97316",
    600: "#EA580C",
    700: "#C2410C",
    800: "#9A3412",
    900: "#7C2D12"
  },

  // Neutral Colors - Rich Grays
  neutral: {
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#E5E5E5",
    300: "#D4D4D4",
    400: "#A3A3A3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717"
  },

  // Background System
  background: {
    light: {
      primary: "#FFFFFF",
      secondary: "#F8FAFC",
      tertiary: "#F1F5F9",
      overlay: "rgba(255, 255, 255, 0.95)"
    },
    dark: {
      primary: "#0F172A",
      secondary: "#1E293B", 
      tertiary: "#334155",
      overlay: "rgba(15, 23, 42, 0.95)"
    }
  },

  // Glass Effect Colors
  glass: {
    light: "rgba(255, 255, 255, 0.25)",
    dark: "rgba(15, 23, 42, 0.25)",
    border: "rgba(255, 255, 255, 0.18)"
  }
};

// Premium Typography System
export const LuxuryTypography = {
  // Font Families - System optimized
  fontFamily: {
    primary: "System", // iOS: SF Pro, Android: Roboto
    secondary: "System",
    mono: "Menlo, Monaco, 'Courier New', monospace"
  },

  // Font Weights
  fontWeight: {
    thin: "100",
    extraLight: "200", 
    light: "300",
    regular: "400",
    medium: "500",
    semiBold: "600",
    bold: "700",
    extraBold: "800",
    black: "900"
  },

  // Font Sizes (Responsive Scale)
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
    "5xl": 48,
    "6xl": 60,
    "7xl": 72
  },

  // Line Heights
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2
  },

  // Letter Spacing
  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
    widest: 0.1
  },

  // Text Styles - Semantic Typography
  textStyles: {
    // Display Text (Hero sections)
    display: {
      large: {
        fontSize: 72,
        fontWeight: "800",
        lineHeight: 1.1,
        letterSpacing: -0.025
      },
      medium: {
        fontSize: 60,
        fontWeight: "700", 
        lineHeight: 1.15,
        letterSpacing: -0.02
      },
      small: {
        fontSize: 48,
        fontWeight: "600",
        lineHeight: 1.2,
        letterSpacing: -0.015
      }
    },

    // Headlines
    headline: {
      large: {
        fontSize: 36,
        fontWeight: "600",
        lineHeight: 1.25,
        letterSpacing: -0.01
      },
      medium: {
        fontSize: 30,
        fontWeight: "600",
        lineHeight: 1.3
      },
      small: {
        fontSize: 24,
        fontWeight: "600",
        lineHeight: 1.35
      }
    },

    // Titles
    title: {
      large: {
        fontSize: 20,
        fontWeight: "600",
        lineHeight: 1.4
      },
      medium: {
        fontSize: 18,
        fontWeight: "600",
        lineHeight: 1.45
      },
      small: {
        fontSize: 16,
        fontWeight: "600",
        lineHeight: 1.5
      }
    },

    // Body Text
    body: {
      large: {
        fontSize: 18,
        fontWeight: "400",
        lineHeight: 1.5
      },
      medium: {
        fontSize: 16,
        fontWeight: "400",
        lineHeight: 1.5
      },
      small: {
        fontSize: 14,
        fontWeight: "400",
        lineHeight: 1.5
      }
    },

    // Labels
    label: {
      large: {
        fontSize: 16,
        fontWeight: "500",
        lineHeight: 1.45
      },
      medium: {
        fontSize: 14,
        fontWeight: "500",
        lineHeight: 1.45
      },
      small: {
        fontSize: 12,
        fontWeight: "500",
        lineHeight: 1.45
      }
    },

    // Captions
    caption: {
      large: {
        fontSize: 14,
        fontWeight: "400",
        lineHeight: 1.4
      },
      medium: {
        fontSize: 12,
        fontWeight: "400",
        lineHeight: 1.4
      },
      small: {
        fontSize: 10,
        fontWeight: "400",
        lineHeight: 1.4
      }
    }
  }
};

// Premium Spacing System (8pt grid)
export const LuxurySpacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384
};

// Border Radius System
export const LuxuryBorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999
};

// Premium Shadow System
export const LuxuryShadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },

  // Subtle shadows
  xs: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  sm: {
    shadowColor: "#000000", 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },

  // Standard shadows
  base: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6
  },

  // Prominent shadows
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10
  },
  xl: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 15
  },

  // Premium glass effect shadows
  glass: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8
  }
};

// Animation System
export const LuxuryAnimations = {
  // Duration presets
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 400,
    slower: 600,
    slowest: 1000
  },

  // Easing curves
  easing: {
    linear: "linear",
    ease: "ease",
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
    
    // Custom premium curves
    spring: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    smooth: "cubic-bezier(0.4, 0.0, 0.2, 1)",
    snappy: "cubic-bezier(0.25, 0.46, 0.45, 0.94)"
  }
};

// Z-Index Scale
export const LuxuryZIndex = {
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
  tooltip: 1800
};

// Component-specific theme tokens
export const LuxuryComponents = {
  // Button variants
  button: {
    primary: {
      background: LuxuryColors.primary[600],
      backgroundHover: LuxuryColors.primary[700],
      backgroundPressed: LuxuryColors.primary[800],
      text: LuxuryColors.neutral[50],
      border: "transparent",
      shadow: LuxuryShadows.base
    },
    secondary: {
      background: LuxuryColors.neutral[100],
      backgroundHover: LuxuryColors.neutral[200],
      backgroundPressed: LuxuryColors.neutral[300],
      text: LuxuryColors.primary[700],
      border: LuxuryColors.neutral[300],
      shadow: LuxuryShadows.sm
    },
    accent: {
      background: LuxuryColors.accent[500],
      backgroundHover: LuxuryColors.accent[600],
      backgroundPressed: LuxuryColors.accent[700],
      text: LuxuryColors.neutral[50],
      border: "transparent",
      shadow: LuxuryShadows.md
    },
    ghost: {
      background: "transparent",
      backgroundHover: LuxuryColors.neutral[100],
      backgroundPressed: LuxuryColors.neutral[200],
      text: LuxuryColors.primary[600],
      border: "transparent",
      shadow: LuxuryShadows.none
    }
  },

  // Card variants
  card: {
    elevated: {
      background: LuxuryColors.background.light.primary,
      border: LuxuryColors.neutral[200],
      shadow: LuxuryShadows.lg,
      borderRadius: LuxuryBorderRadius.xl
    },
    flat: {
      background: LuxuryColors.background.light.secondary,
      border: LuxuryColors.neutral[200],
      shadow: LuxuryShadows.none,
      borderRadius: LuxuryBorderRadius.lg
    },
    glass: {
      background: LuxuryColors.glass.light,
      border: LuxuryColors.glass.border,
      shadow: LuxuryShadows.glass,
      borderRadius: LuxuryBorderRadius.xl,
      backdropFilter: "blur(20px)"
    }
  },

  // Input variants
  input: {
    default: {
      background: LuxuryColors.background.light.primary,
      border: LuxuryColors.neutral[300],
      borderFocus: LuxuryColors.primary[500],
      text: LuxuryColors.neutral[900],
      placeholder: LuxuryColors.neutral[500],
      shadow: LuxuryShadows.sm,
      borderRadius: LuxuryBorderRadius.lg
    },
    filled: {
      background: LuxuryColors.neutral[100],
      border: "transparent",
      borderFocus: LuxuryColors.primary[500],
      text: LuxuryColors.neutral[900],
      placeholder: LuxuryColors.neutral[500],
      shadow: LuxuryShadows.none,
      borderRadius: LuxuryBorderRadius.lg
    }
  }
};

// Export complete luxury theme
export const LuxuryTheme = {
  colors: LuxuryColors,
  typography: LuxuryTypography,
  spacing: LuxurySpacing,
  borderRadius: LuxuryBorderRadius,
  shadows: LuxuryShadows,
  animations: LuxuryAnimations,
  zIndex: LuxuryZIndex,
  components: LuxuryComponents
};