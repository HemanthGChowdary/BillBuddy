/**
 * Style Utility Functions
 * Helper functions for dynamic styling and common patterns
 */

import { Platform, Dimensions } from 'react-native';
import { Colors, Spacing, BorderRadius } from './theme';

// Get device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Responsive sizing based on screen width
 */
export const responsiveSize = (size) => {
  const baseWidth = 375; // iPhone X width as base
  const scale = screenWidth / baseWidth;
  return Math.round(size * scale);
};

/**
 * Get responsive font size
 */
export const responsiveFontSize = (size) => {
  return responsiveSize(size);
};

/**
 * Get responsive spacing
 */
export const responsiveSpacing = (spacing) => {
  return responsiveSize(spacing);
};

/**
 * Platform-specific styling
 */
export const platformStyles = {
  // Shadow for different platforms
  shadow: (elevation = 4) => {
    if (Platform.OS === 'ios') {
      return {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: elevation,
      };
    } else {
      return {
        elevation,
      };
    }
  },
  
  // Border radius adjustment for Android
  borderRadius: (radius) => {
    if (Platform.OS === 'android') {
      return Math.min(radius, 8); // Android has issues with large border radius
    }
    return radius;
  },
  
  // Status bar height
  statusBarHeight: Platform.OS === 'ios' ? 44 : 24,
  
  // Safe area adjustments
  safeAreaPadding: {
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
  },
};

/**
 * Color manipulation utilities
 */
export const colorUtils = {
  // Add alpha to hex color
  addAlpha: (hexColor, alpha) => {
    const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return `${hexColor}${alphaHex}`;
  },
  
  // Lighten color (for hover states)
  lighten: (hexColor, amount = 0.1) => {
    const num = parseInt(hexColor.replace('#', ''), 16);
    const amt = Math.round(2.55 * amount * 100);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  },
  
  // Darken color (for pressed states)
  darken: (hexColor, amount = 0.1) => {
    const num = parseInt(hexColor.replace('#', ''), 16);
    const amt = Math.round(2.55 * amount * 100);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
  },
  
  // Get contrasting text color
  getContrastColor: (hexColor) => {
    const num = parseInt(hexColor.replace('#', ''), 16);
    const R = (num >> 16) & 255;
    const G = (num >> 8) & 255;
    const B = num & 255;
    const brightness = (R * 299 + G * 587 + B * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  },
};

/**
 * Animation utilities
 */
export const animationUtils = {
  // Standard timing functions
  timing: {
    fast: 150,
    normal: 300,
    slow: 600,
  },
  
  // Easing functions
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
  
  // Scale animation for buttons
  scaleAnimation: {
    transform: [{ scale: 0.98 }],
  },
  
  // Fade animation config
  fadeConfig: {
    duration: 300,
    useNativeDriver: true,
  },
  
  // Slide animation config
  slideConfig: {
    duration: 300,
    useNativeDriver: true,
  },
};

/**
 * Layout utilities
 */
export const layoutUtils = {
  // Screen dimensions
  screen: {
    width: screenWidth,
    height: screenHeight,
    isSmall: screenWidth < 375,
    isMedium: screenWidth >= 375 && screenWidth < 414,
    isLarge: screenWidth >= 414,
  },
  
  // Grid system
  grid: {
    // Get column width for grid layouts
    getColumnWidth: (columns, spacing = Spacing.md) => {
      const totalSpacing = spacing * (columns - 1);
      const contentWidth = screenWidth - (Spacing.xl * 2); // Account for container padding
      return (contentWidth - totalSpacing) / columns;
    },
    
    // Get grid item styles
    getGridItemStyle: (columns, spacing = Spacing.md) => ({
      width: layoutUtils.grid.getColumnWidth(columns, spacing),
      marginRight: spacing,
      marginBottom: spacing,
    }),
  },
  
  // Container utilities
  container: {
    // Full width with padding
    fullWidth: {
      width: '100%',
      paddingHorizontal: Spacing.xl,
    },
    
    // Centered container with max width
    centered: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 600, // Max width for tablets
      paddingHorizontal: Spacing.xl,
    },
    
    // Card container
    card: {
      backgroundColor: Colors.white,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      ...platformStyles.shadow(2),
    },
  },
};

/**
 * Typography utilities
 */
export const typographyUtils = {
  // Get responsive text size
  getResponsiveTextSize: (baseSize) => {
    if (layoutUtils.screen.isSmall) {
      return baseSize - 1;
    } else if (layoutUtils.screen.isLarge) {
      return baseSize + 1;
    }
    return baseSize;
  },
  
  // Text truncation
  truncate: {
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  
  // Text alignment utilities
  align: {
    left: { textAlign: 'left' },
    center: { textAlign: 'center' },
    right: { textAlign: 'right' },
  },
  
  // Text case utilities
  case: {
    uppercase: { textTransform: 'uppercase' },
    lowercase: { textTransform: 'lowercase' },
    capitalize: { textTransform: 'capitalize' },
  },
};

/**
 * Form utilities
 */
export const formUtils = {
  // Input validation styles
  getInputValidationStyle: (isValid, hasError) => {
    if (hasError) {
      return {
        borderColor: Colors.error.light,
        borderWidth: 2,
      };
    } else if (isValid) {
      return {
        borderColor: Colors.success.light,
        borderWidth: 1,
      };
    }
    return {};
  },
  
  // Button state styles
  getButtonStateStyle: (pressed, disabled) => {
    const styles = [];
    
    if (disabled) {
      styles.push({ opacity: 0.5 });
    } else if (pressed) {
      styles.push({ opacity: 0.8, transform: [{ scale: 0.98 }] });
    }
    
    return styles;
  },
  
  // Form spacing
  formSpacing: {
    marginBottom: Spacing.lg,
  },
  
  // Label styles
  labelStyle: {
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
};

/**
 * List utilities
 */
export const listUtils = {
  // FlatList optimization props
  optimizationProps: {
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    windowSize: 10,
    initialNumToRender: 8,
    getItemLayout: null, // Use only if items have fixed height
  },
  
  // Item separator component
  itemSeparator: {
    height: Spacing.sm,
  },
  
  // List empty component styles
  emptyComponent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['6xl'],
  },
  
  // Section header styles
  sectionHeader: {
    backgroundColor: Colors.gray50,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
};

/**
 * Modal utilities
 */
export const modalUtils = {
  // Modal backdrop
  backdrop: {
    flex: 1,
    backgroundColor: colorUtils.addAlpha('#000000', 0.5),
  },
  
  // Modal container positioning
  positioning: {
    bottom: { justifyContent: 'flex-end' },
    center: { justifyContent: 'center' },
    top: { justifyContent: 'flex-start', paddingTop: platformStyles.statusBarHeight },
  },
  
  // Modal animation configs
  animations: {
    slide: {
      animationType: 'slide',
      presentationStyle: 'overFullScreen',
    },
    fade: {
      animationType: 'fade',
      presentationStyle: 'overFullScreen',
    },
  },
};

/**
 * Accessibility utilities
 */
export const accessibilityUtils = {
  // Screen reader labels
  getButtonLabel: (action, itemName) => {
    return `${action} ${itemName}`;
  },
  
  // Accessibility hints
  hints: {
    button: 'Double tap to activate',
    link: 'Double tap to navigate',
    input: 'Double tap to edit',
  },
  
  // Accessibility roles
  roles: {
    button: 'button',
    link: 'link',
    text: 'text',
    image: 'image',
    header: 'header',
  },
};

/**
 * Debug utilities (for development)
 */
export const debugUtils = {
  // Border debug (to visualize layouts)
  border: __DEV__ ? {
    borderWidth: 1,
    borderColor: 'red',
  } : {},
  
  // Background debug
  background: __DEV__ ? {
    backgroundColor: colorUtils.addAlpha('#FF0000', 0.1),
  } : {},
  
};

export default {
  responsiveSize,
  responsiveFontSize,
  responsiveSpacing,
  platformStyles,
  colorUtils,
  animationUtils,
  layoutUtils,
  typographyUtils,
  formUtils,
  listUtils,
  modalUtils,
  accessibilityUtils,
  debugUtils,
};