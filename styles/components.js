/**
 * Global Component Styles
 * Reusable component styling patterns for Bill Buddy app
 */

import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows, IconSizes } from './theme';

// Helper function to get themed colors
export const getThemedColors = (darkMode) => ({
  background: darkMode ? Colors.background.dark : Colors.background.light,
  cardBackground: darkMode ? Colors.background.card.dark : Colors.background.card.light,
  modalBackground: darkMode ? Colors.background.modal.dark : Colors.background.modal.light,
  textPrimary: darkMode ? Colors.text.primary.dark : Colors.text.primary.light,
  textSecondary: darkMode ? Colors.text.secondary.dark : Colors.text.secondary.light,
  textTertiary: darkMode ? Colors.text.tertiary.dark : Colors.text.tertiary.light,
  textAccent: darkMode ? Colors.text.accent.dark : Colors.text.accent.light,
  primary: darkMode ? Colors.secondary : Colors.primary,
  primaryPressed: darkMode ? Colors.secondaryDark : Colors.primaryDark,
});

// Global Container Styles
export const ContainerStyles = StyleSheet.create({
  // Screen Containers
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background.light,
  },
  darkScreenContainer: {
    backgroundColor: Colors.background.dark,
  },
  
  // Safe Area
  safeArea: {
    flex: 1,
  },
  
  // Content Containers
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  
  scrollContainer: {
    flexGrow: 1,
  },
  
  // Loading Container
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  
  // Empty State Container
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
});

// Header Styles
export const HeaderStyles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  
  title: {
    ...Typography.textStyles.h1,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  darkTitle: {
    color: Colors.secondary,
  },
  
  subtitle: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary.light,
    textAlign: 'center',
  },
  darkSubtitle: {
    color: Colors.text.secondary.dark,
  },
});

// Card Styles
export const CardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card.light,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.base,
  },
  darkCard: {
    backgroundColor: Colors.background.card.dark,
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  
  cardTitle: {
    ...Typography.textStyles.h4,
    color: Colors.text.primary.light,
    marginBottom: Spacing.xs,
  },
  darkCardTitle: {
    color: Colors.text.primary.dark,
  },
  
  cardSubtitle: {
    ...Typography.textStyles.bodySmall,
    color: Colors.text.secondary.light,
  },
  darkCardSubtitle: {
    color: Colors.text.secondary.dark,
  },
  
  cardAmount: {
    ...Typography.textStyles.h2,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
  },
  darkCardAmount: {
    color: Colors.secondary,
  },
  
  cardDate: {
    ...Typography.textStyles.caption,
    color: Colors.text.secondary.light,
    textAlign: 'right',
  },
  darkCardDate: {
    color: Colors.text.secondary.dark,
  },
});

// Action Button Styles (Standardized across all screens)
export const ActionButtonStyles = StyleSheet.create({
  // Container
  actionContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  
  // Base Button
  actionButton: {
    flex: 1,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  
  actionButtonPressed: {
    opacity: 0.7,
  },
  
  // Button Text
  actionButtonText: {
    ...Typography.textStyles.button,
  },
  
  // Edit Button
  editButton: {
    backgroundColor: Colors.edit.background.light,
    borderColor: Colors.edit.border.light,
  },
  darkEditButton: {
    backgroundColor: Colors.edit.background.dark,
    borderColor: Colors.edit.border.dark,
  },
  editButtonText: {
    color: Colors.edit.text.light,
  },
  darkEditButtonText: {
    color: Colors.edit.text.dark,
  },
  
  // Delete Button
  deleteButton: {
    backgroundColor: Colors.delete.background.light,
    borderColor: Colors.delete.border.light,
  },
  darkDeleteButton: {
    backgroundColor: Colors.delete.background.dark,
    borderColor: Colors.delete.border.dark,
  },
  deleteButtonText: {
    color: Colors.delete.text.light,
  },
  darkDeleteButtonText: {
    color: Colors.delete.text.dark,
  },
  
  // Duplicate/Invite Button
  duplicateButton: {
    backgroundColor: Colors.duplicate.background.light,
    borderColor: Colors.duplicate.border.light,
  },
  darkDuplicateButton: {
    backgroundColor: Colors.duplicate.background.dark,
    borderColor: Colors.duplicate.border.dark,
  },
  duplicateButtonText: {
    color: Colors.duplicate.text.light,
  },
  darkDuplicateButtonText: {
    color: Colors.duplicate.text.dark,
  },
  
  // Invite Button (same as duplicate)
  inviteButton: {
    backgroundColor: Colors.invite.background.light,
    borderColor: Colors.invite.border.light,
  },
  darkInviteButton: {
    backgroundColor: Colors.invite.background.dark,
    borderColor: Colors.invite.border.dark,
  },
  inviteButtonText: {
    color: Colors.invite.text.light,
  },
  darkInviteButtonText: {
    color: Colors.invite.text.dark,
  },
});

// Primary Button Styles
export const ButtonStyles = StyleSheet.create({
  // Primary Button
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    ...Shadows.sm,
  },
  darkPrimaryButton: {
    backgroundColor: Colors.secondary,
  },
  
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  
  primaryButtonText: {
    ...Typography.textStyles.buttonLarge,
    color: Colors.white,
  },
  
  // Secondary Button
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  darkSecondaryButton: {
    borderColor: Colors.secondary,
  },
  
  secondaryButtonText: {
    ...Typography.textStyles.buttonLarge,
    color: Colors.primary,
  },
  darkSecondaryButtonText: {
    color: Colors.secondary,
  },
  
  // Small Button
  smallButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  darkSmallButton: {
    backgroundColor: Colors.secondary,
  },
  
  smallButtonText: {
    ...Typography.textStyles.button,
    color: Colors.white,
  },
  
  // Disabled Button
  disabledButton: {
    opacity: 0.5,
  },
});

// Input Styles
export const InputStyles = StyleSheet.create({
  // Input Container
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  
  // Label
  inputLabel: {
    ...Typography.textStyles.label,
    color: Colors.text.primary.light,
    marginBottom: Spacing.sm,
  },
  darkInputLabel: {
    color: Colors.text.primary.dark,
  },
  
  // Text Input
  textInput: {
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary.light,
    backgroundColor: Colors.white,
  },
  darkTextInput: {
    borderColor: Colors.gray600,
    backgroundColor: Colors.background.card.dark,
    color: Colors.text.primary.dark,
  },
  
  // Input with Error
  inputError: {
    borderColor: Colors.error.light,
    borderWidth: 2,
  },
  
  // Error Text
  errorText: {
    ...Typography.textStyles.caption,
    color: Colors.error.light,
    marginTop: Spacing.xs,
  },
  darkErrorText: {
    color: Colors.error.dark,
  },
  
  // Search Input
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gray200,
    marginBottom: Spacing.lg,
  },
  darkSearchContainer: {
    backgroundColor: Colors.background.card.dark,
    borderColor: Colors.gray600,
  },
  
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary.light,
  },
  darkSearchInput: {
    color: Colors.text.primary.dark,
  },
  
  searchIcon: {
    marginRight: Spacing.md,
  },
});

// Filter and Sort Styles
export const FilterStyles = StyleSheet.create({
  // Container
  filtersAndSortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  
  filtersContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: Spacing.sm,
  },
  
  // Filter Button
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  darkFilterButton: {
    backgroundColor: Colors.background.card.dark,
    borderColor: Colors.gray600,
  },
  
  activeFilterButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  darkActiveFilterButton: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  
  filterButtonText: {
    ...Typography.textStyles.caption,
    color: Colors.text.secondary.light,
    fontWeight: Typography.fontWeight.medium,
  },
  darkFilterButtonText: {
    color: Colors.text.secondary.dark,
  },
  
  activeFilterButtonText: {
    color: Colors.white,
  },
  
  // Sort Button
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: Spacing.xs,
  },
  darkSortButton: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  
  sortButtonText: {
    ...Typography.textStyles.caption,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
  },
});

// Modal Styles
export const ModalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  darkModalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  
  modalContainer: {
    backgroundColor: Colors.background.modal.light,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xl,
    maxHeight: '90%',
  },
  darkModalContainer: {
    backgroundColor: Colors.background.modal.dark,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  darkModalHeader: {
    borderBottomColor: Colors.gray600,
  },
  
  modalTitle: {
    ...Typography.textStyles.h3,
    color: Colors.text.primary.light,
  },
  darkModalTitle: {
    color: Colors.text.primary.dark,
  },
  
  modalContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  darkModalActions: {
    borderTopColor: Colors.gray600,
  },
});

// List Styles
export const ListStyles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  
  itemSeparator: {
    height: Spacing.sm,
  },
  
  sectionHeader: {
    ...Typography.textStyles.label,
    color: Colors.text.secondary.light,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.light,
  },
  darkSectionHeader: {
    color: Colors.text.secondary.dark,
    backgroundColor: Colors.background.dark,
  },
});

// Empty State Styles
export const EmptyStateStyles = StyleSheet.create({
  emptyIcon: {
    width: IconSizes['2xl'],
    height: IconSizes['2xl'],
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  darkEmptyIcon: {
    backgroundColor: Colors.gray700,
  },
  
  emptyTitle: {
    ...Typography.textStyles.h3,
    color: Colors.text.primary.light,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  darkEmptyTitle: {
    color: Colors.text.primary.dark,
  },
  
  emptySubtitle: {
    ...Typography.textStyles.body,
    color: Colors.text.secondary.light,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: Typography.lineHeight.relaxed,
  },
  darkEmptySubtitle: {
    color: Colors.text.secondary.dark,
  },
  
  clearFiltersButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.base,
    marginTop: Spacing.lg,
  },
  darkClearFiltersButton: {
    backgroundColor: Colors.secondary,
  },
  
  clearFiltersText: {
    ...Typography.textStyles.button,
    color: Colors.white,
    textAlign: 'center',
  },
});

// Status Indicator Styles
export const StatusStyles = StyleSheet.create({
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  
  onlineStatus: {
    backgroundColor: Colors.success.light,
  },
  
  offlineStatus: {
    backgroundColor: Colors.gray400,
  },
  
  activeStatus: {
    backgroundColor: Colors.warning.light,
  },
});

// Utility Styles
export const UtilityStyles = StyleSheet.create({
  // Flex utilities
  flex1: { flex: 1 },
  flexRow: { flexDirection: 'row' },
  flexColumn: { flexDirection: 'column' },
  justifyCenter: { justifyContent: 'center' },
  justifyBetween: { justifyContent: 'space-between' },
  justifyAround: { justifyContent: 'space-around' },
  alignCenter: { alignItems: 'center' },
  alignStart: { alignItems: 'flex-start' },
  alignEnd: { alignItems: 'flex-end' },
  
  // Text utilities
  textCenter: { textAlign: 'center' },
  textLeft: { textAlign: 'left' },
  textRight: { textAlign: 'right' },
  
  // Spacing utilities
  mt4: { marginTop: Spacing.xs },
  mt8: { marginTop: Spacing.sm },
  mt12: { marginTop: Spacing.md },
  mt16: { marginTop: Spacing.lg },
  mt20: { marginTop: Spacing.xl },
  
  mb4: { marginBottom: Spacing.xs },
  mb8: { marginBottom: Spacing.sm },
  mb12: { marginBottom: Spacing.md },
  mb16: { marginBottom: Spacing.lg },
  mb20: { marginBottom: Spacing.xl },
  
  // Padding utilities
  p16: { padding: Spacing.lg },
  px16: { paddingHorizontal: Spacing.lg },
  py16: { paddingVertical: Spacing.lg },
  
  // Border utilities
  borderTop: { borderTopWidth: 1, borderTopColor: Colors.gray200 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: Colors.gray200 },
  darkBorderTop: { borderTopColor: Colors.gray600 },
  darkBorderBottom: { borderBottomColor: Colors.gray600 },
  
  // Shadow utilities
  shadowSm: Shadows.sm,
  shadowBase: Shadows.base,
  shadowMd: Shadows.md,
  
  // Opacity utilities
  opacityDisabled: { opacity: 0.5 },
  opacityPressed: { opacity: 0.7 },
});

export default {
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
};