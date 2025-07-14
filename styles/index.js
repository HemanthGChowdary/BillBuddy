/**
 * Global Styles Index
 * Central export point for all styling and theming utilities
 */

// Theme and Colors
export {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Animation,
  ZIndex,
  Opacity,
  IconSizes,
} from './theme';

// Component Styles
export {
  getThemedColors,
  ContainerStyles,
  HeaderStyles,
  CardStyles,
  ActionButtonStyles,
  ButtonStyles,
  InputStyles,
  FilterStyles,
  ModalStyles,
  ListStyles,
  EmptyStateStyles,
  StatusStyles,
  UtilityStyles,
  default as ComponentStyles,
} from './components';

// Constants
export {
  VALIDATION,
  UI,
  STORAGE_KEYS,
  CURRENCY_OPTIONS,
  SPLIT_TYPES,
  SPLIT_TYPE_OPTIONS,
  FILTER_OPTIONS,
  SORT_OPTIONS,
  SORT_TYPE_OPTIONS,
  HAPTIC_TYPES,
  IMAGE_PICKER_OPTIONS,
  DEFAULTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PLATFORM,
  REGEX,
  DATE_FORMATS,
  DEV,
  default as Constants,
} from './constants';

// Utility Functions
export const createThemedStyles = (darkMode) => {
  const themedColors = getThemedColors(darkMode);
  
  return {
    colors: themedColors,
    
    // Helper functions for common style patterns
    getContainerStyle: (style = {}) => ({
      ...ContainerStyles.screenContainer,
      ...(darkMode && ContainerStyles.darkScreenContainer),
      ...style,
    }),
    
    getCardStyle: (style = {}) => ({
      ...CardStyles.card,
      ...(darkMode && CardStyles.darkCard),
      ...style,
    }),
    
    getHeaderStyle: (style = {}) => ({
      ...HeaderStyles.header,
      ...style,
    }),
    
    getTitleStyle: (style = {}) => ({
      ...HeaderStyles.title,
      ...(darkMode && HeaderStyles.darkTitle),
      ...style,
    }),
    
    getSubtitleStyle: (style = {}) => ({
      ...HeaderStyles.subtitle,
      ...(darkMode && HeaderStyles.darkSubtitle),
      ...style,
    }),
    
    getTextInputStyle: (style = {}) => ({
      ...InputStyles.textInput,
      ...(darkMode && InputStyles.darkTextInput),
      ...style,
    }),
    
    getPrimaryButtonStyle: (style = {}) => ({
      ...ButtonStyles.primaryButton,
      ...(darkMode && ButtonStyles.darkPrimaryButton),
      ...style,
    }),
    
    getActionButtonStyle: (type, style = {}) => {
      const baseStyle = {
        ...ActionButtonStyles.actionButton,
        ...style,
      };
      
      switch (type) {
        case 'edit':
          return {
            ...baseStyle,
            ...ActionButtonStyles.editButton,
            ...(darkMode && ActionButtonStyles.darkEditButton),
          };
        case 'delete':
          return {
            ...baseStyle,
            ...ActionButtonStyles.deleteButton,
            ...(darkMode && ActionButtonStyles.darkDeleteButton),
          };
        case 'duplicate':
        case 'invite':
          return {
            ...baseStyle,
            ...ActionButtonStyles.duplicateButton,
            ...(darkMode && ActionButtonStyles.darkDuplicateButton),
          };
        default:
          return baseStyle;
      }
    },
    
    getActionButtonTextStyle: (type, style = {}) => {
      const baseStyle = {
        ...ActionButtonStyles.actionButtonText,
        ...style,
      };
      
      switch (type) {
        case 'edit':
          return {
            ...baseStyle,
            ...ActionButtonStyles.editButtonText,
            ...(darkMode && ActionButtonStyles.darkEditButtonText),
          };
        case 'delete':
          return {
            ...baseStyle,
            ...ActionButtonStyles.deleteButtonText,
            ...(darkMode && ActionButtonStyles.darkDeleteButtonText),
          };
        case 'duplicate':
        case 'invite':
          return {
            ...baseStyle,
            ...ActionButtonStyles.duplicateButtonText,
            ...(darkMode && ActionButtonStyles.darkDuplicateButtonText),
          };
        default:
          return baseStyle;
      }
    },
  };
};

// Common style combinations
export const CommonStyles = {
  // Screen layouts
  fullScreenContainer: {
    ...ContainerStyles.screenContainer,
    ...ContainerStyles.safeArea,
  },
  
  centeredContainer: {
    ...ContainerStyles.screenContainer,
    ...UtilityStyles.justifyCenter,
    ...UtilityStyles.alignCenter,
  },
  
  // Card layouts
  standardCard: {
    ...CardStyles.card,
    ...UtilityStyles.shadowBase,
  },
  
  // Button layouts
  actionButtonRow: {
    ...ActionButtonStyles.actionContainer,
    ...UtilityStyles.flexRow,
  },
  
  // Input layouts
  formContainer: {
    ...ContainerStyles.contentContainer,
    ...UtilityStyles.py16,
  },
  
  // Modal layouts
  bottomSheetModal: {
    ...ModalStyles.modalOverlay,
    ...UtilityStyles.justifyEnd,
  },
  
  // List layouts
  standardList: {
    ...ListStyles.listContainer,
    ...ContainerStyles.flex1,
  },
};

// Export default styles object for convenience
export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  ComponentStyles,
  Constants,
  createThemedStyles,
  CommonStyles,
};