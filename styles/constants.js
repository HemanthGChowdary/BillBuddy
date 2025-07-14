/**
 * Global Constants
 * Centralized constants and configuration for Bill Buddy app
 */

import { Platform } from 'react-native';

// Validation Constants
export const VALIDATION = {
  // Input Length Limits
  MAX_NAME_LENGTH: 50,
  MAX_NOTE_LENGTH: 500,
  MAX_DESCRIPTION_LENGTH: 200,
  MAX_AMOUNT_LENGTH: 10,
  MAX_SEARCH_LENGTH: 100,
  MAX_CUSTOM_SPLIT_LENGTH: 8,
  MAX_PERCENTAGE_LENGTH: 3,
  MAX_GROUP_NAME_LENGTH: 50,
  MAX_EXPENSE_NAME_LENGTH: 50,
  MAX_WORDS_LIMIT: 100,
  
  // Minimum Values
  MIN_NAME_LENGTH: 2,
  MIN_AMOUNT_VALUE: 0.01,
  
  // Maximum Values
  MAX_AMOUNT_VALUE: 999999.99,
  MAX_PERCENTAGE: 100,
  
  // Tolerance
  PERCENTAGE_TOLERANCE: 105, // 5% tolerance for percentage splits
};

// UI Constants
export const UI = {
  // Icon Sizes
  ICON_SIZE_XS: 12,
  ICON_SIZE_SM: 16,
  ICON_SIZE_BASE: 20,
  ICON_SIZE_MD: 24,
  ICON_SIZE_LG: 32,
  ICON_SIZE_XL: 48,
  ICON_SIZE_2XL: 64,
  
  // Border Radius
  BORDER_RADIUS_SM: 8,
  BORDER_RADIUS_MD: 12,
  BORDER_RADIUS_LG: 16,
  BORDER_RADIUS_XL: 20,
  
  // Opacity Values
  OPACITY_DISABLED: 0.5,
  OPACITY_PRESSED: 0.7,
  OPACITY_LIGHT: 0.8,
  OPACITY_MEDIUM: 0.9,
  OPACITY_FULL: 1.0,
  
  // Animation Durations (milliseconds)
  ANIMATION_DURATION_FAST: 150,
  ANIMATION_DURATION_NORMAL: 300,
  ANIMATION_DURATION_SLOW: 600,
  
  // Z-Index Values
  Z_INDEX_DROPDOWN_LOW: 1000,
  Z_INDEX_DROPDOWN_MEDIUM: 2000,
  Z_INDEX_DROPDOWN_HIGH: 3000,
  Z_INDEX_MODAL: 4000,
  Z_INDEX_TOOLTIP: 5000,
  
  // List Rendering Performance
  MAX_RENDER_BATCH: 10,
  WINDOW_SIZE: 10,
  INITIAL_NUM_TO_RENDER: 8,
  
  // Image Quality
  IMAGE_QUALITY_HIGH: 1,
  IMAGE_QUALITY_MEDIUM: 0.8,
  IMAGE_ASPECT_RATIO: [4, 3],
  
  // Safe Area Insets
  MIN_SAFE_AREA_BOTTOM: 20,
  NAVIGATION_SPACING_OFFSET: 40, // Extra space for navigation
};

// Storage Keys
export const STORAGE_KEYS = {
  BILLS: 'billBuddy_bills',
  FRIENDS: 'billBuddy_friends',
  GROUPS: 'billBuddy_groups',
  PROFILE: 'billBuddy_profile',
  SETTINGS: 'billBuddy_settings',
  THEME_MODE: 'billBuddy_themeMode',
  LIQUID_GLASS_MODE: 'liquidGlassMode',
  FRIEND_BALANCES: 'billBuddy_friendBalances',
};

// Currency Options
export const CURRENCY_OPTIONS = [
  { label: "🇺🇸 USD ($)", value: "USD" },
  { label: "🇨🇦 CAD (C$)", value: "CAD" },
  { label: "🇮🇳 INR (₹)", value: "INR" },
  { label: "🇲🇽 MXN (Mex$)", value: "MXN" },
];

// Split Types
export const SPLIT_TYPES = {
  EQUAL: 'equal',
  CUSTOM: 'custom',
  PERCENTAGE: 'percentage',
  EXACT: 'exact',
};

// Split Type Options for UI
export const SPLIT_TYPE_OPTIONS = [
  { label: '⚖️ Equal split', value: SPLIT_TYPES.EQUAL },
  { label: '💰 Custom split', value: SPLIT_TYPES.CUSTOM },
];

// Filter Options
export const FILTER_OPTIONS = {
  ALL: 'all',
  THIS_WEEK: 'thisWeek',
  THIS_MONTH: 'thisMonth',
  SETTLED: 'settled',
  OWES: 'owes',
  ACTIVE: 'active',
};

// Sort Options
export const SORT_OPTIONS = {
  DATE: 'date',
  NAME: 'name',
  AMOUNT: 'amount',
  MEMBERS: 'members',
  BALANCE: 'balance',
};

// Sort Type Options for UI
export const SORT_TYPE_OPTIONS = [
  { label: 'Date', value: SORT_OPTIONS.DATE },
  { label: 'Name', value: SORT_OPTIONS.NAME },
  { label: 'Amount', value: SORT_OPTIONS.AMOUNT },
  { label: 'Members', value: SORT_OPTIONS.MEMBERS },
];

// Haptic Feedback Types
export const HAPTIC_TYPES = {
  LIGHT: 'Light',
  MEDIUM: 'Medium',
  HEAVY: 'Heavy',
  SUCCESS: 'Success',
  WARNING: 'Warning',
  ERROR: 'Error',
};

// Image Picker Options
export const IMAGE_PICKER_OPTIONS = {
  mediaTypes: 'Images',
  allowsEditing: true,
  aspect: UI.IMAGE_ASPECT_RATIO,
  quality: UI.IMAGE_QUALITY_MEDIUM,
};

// Default Values
export const DEFAULTS = {
  CURRENCY: 'USD',
  SPLIT_TYPE: SPLIT_TYPES.EQUAL,
  SORT_BY: SORT_OPTIONS.DATE,
  FILTER_BY: FILTER_OPTIONS.ALL,
  PROFILE_EMOJI: '👤',
  GROUP_DESCRIPTION: '',
  BILL_NOTE: '',
  THEME_MODE: 'light',
  LIQUID_GLASS_MODE: false,
};

// Error Messages
export const ERROR_MESSAGES = {
  // General
  NETWORK_ERROR: 'Network connection error. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  
  // Validation
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_AMOUNT: 'Please enter a valid amount',
  AMOUNT_TOO_LOW: `Amount must be at least $${VALIDATION.MIN_AMOUNT_VALUE}`,
  AMOUNT_TOO_HIGH: `Amount cannot exceed $${VALIDATION.MAX_AMOUNT_VALUE.toLocaleString()}`,
  NAME_TOO_SHORT: `Name must be at least ${VALIDATION.MIN_NAME_LENGTH} characters`,
  NAME_TOO_LONG: `Name cannot exceed ${VALIDATION.MAX_NAME_LENGTH} characters`,
  NOTE_TOO_LONG: `Note cannot exceed ${VALIDATION.MAX_NOTE_LENGTH} characters`,
  
  // Duplicates
  DUPLICATE_NAME: 'A friend with this name already exists',
  DUPLICATE_GROUP: 'A group with this name already exists',
  
  // Permissions
  CAMERA_PERMISSION: 'Camera permission is required to take photos',
  GALLERY_PERMISSION: 'Gallery permission is required to select photos',
  
  // Data
  NO_DATA_FOUND: 'No data found',
  FAILED_TO_LOAD: 'Failed to load data. Please try again.',
  FAILED_TO_SAVE: 'Failed to save data. Please try again.',
  FAILED_TO_DELETE: 'Failed to delete. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  FRIEND_ADDED: 'Friend added successfully! 🎉',
  FRIEND_UPDATED: 'Friend updated successfully! ✏️',
  FRIEND_DELETED: 'Friend deleted successfully! 🗑️',
  
  GROUP_CREATED: 'Group created successfully! 🎉',
  GROUP_UPDATED: 'Group updated successfully! ✏️',
  GROUP_DELETED: 'Group deleted successfully! 🗑️',
  
  BILL_ADDED: 'Bill added successfully! 🎉',
  BILL_UPDATED: 'Bill updated successfully! ✏️',
  BILL_DELETED: 'Bill deleted successfully! 🗑️',
  BILL_DUPLICATED: 'Bill duplicated successfully! 📋',
  
  EXPENSE_ADDED: 'Expense added successfully! 🎉',
  EXPENSE_UPDATED: 'Expense updated successfully! ✏️',
  EXPENSE_DELETED: 'Expense deleted successfully! 🗑️',
  
  PROFILE_UPDATED: 'Profile updated successfully! ✏️',
  SETTINGS_SAVED: 'Settings saved successfully! ⚙️',
  
  PHOTO_UPLOADED: 'Photo uploaded successfully! 📸',
  PHOTO_REMOVED: 'Photo removed successfully! 🗑️',
};

// Platform-specific Constants
export const PLATFORM = {
  IS_IOS: Platform.OS === 'ios',
  IS_ANDROID: Platform.OS === 'android',
  
  // Keyboard Behavior
  KEYBOARD_BEHAVIOR: Platform.OS === 'ios' ? 'padding' : 'height',
  
  // Status Bar
  STATUS_BAR_HEIGHT: Platform.OS === 'ios' ? 44 : 24,
};

// Regular Expressions
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[\d\s\-\(\)]{10,}$/,
  NUMERIC: /^\d*\.?\d*$/,
  AMOUNT: /^\d+(\.\d{1,2})?$/,
  PERCENTAGE: /^(100|[1-9]?\d)(\.\d{1,2})?$/,
};

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'EEEE, MMMM dd, yyyy',
  TIME: 'h:mm a',
  DATETIME: 'MMM dd, yyyy h:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
};

// Development Constants
export const DEV = {
  LOG_LEVEL: __DEV__ ? 'debug' : 'error',
  ENABLE_PERFORMANCE_MONITOR: __DEV__,
  ENABLE_NETWORK_INSPECTOR: __DEV__,
  MOCK_DATA: __DEV__,
};

export default {
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
};