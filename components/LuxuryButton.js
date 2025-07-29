import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LuxuryTheme } from '../styles/luxuryTheme';
import * as Haptics from 'expo-haptics';

/**
 * Premium Button Component
 * App Store Ready with luxury aesthetics
 */
export const LuxuryButton = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, accent, ghost
  size = 'medium', // small, medium, large
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left', // left, right
  fullWidth = false,
  style,
  textStyle,
  ...props
}) => {
  const { colors, typography, spacing, borderRadius, shadows, animations } = LuxuryTheme;

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const getVariantStyles = () => {
    const variants = {
      primary: {
        backgroundColor: colors.primary[600],
        borderColor: 'transparent',
        ...shadows.base
      },
      secondary: {
        backgroundColor: colors.neutral[100],
        borderColor: colors.neutral[300],
        borderWidth: 1,
        ...shadows.sm
      },
      accent: {
        backgroundColor: colors.accent[500],
        borderColor: 'transparent',
        ...shadows.md
      },
      ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        ...shadows.none
      }
    };

    return variants[variant] || variants.primary;
  };

  const getTextColor = () => {
    const textColors = {
      primary: colors.neutral[50],
      secondary: colors.primary[700],
      accent: colors.neutral[50],
      ghost: colors.primary[600]
    };

    return textColors[variant] || textColors.primary;
  };

  const getSizeStyles = () => {
    const sizes = {
      small: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        minHeight: 36,
        borderRadius: borderRadius.md
      },
      medium: {
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[3],
        minHeight: 44,
        borderRadius: borderRadius.lg
      },
      large: {
        paddingHorizontal: spacing[8],
        paddingVertical: spacing[4],
        minHeight: 52,
        borderRadius: borderRadius.xl
      }
    };

    return sizes[size] || sizes.medium;
  };

  const getTextSize = () => {
    const textSizes = {
      small: typography.textStyles.label.small,
      medium: typography.textStyles.label.medium,
      large: typography.textStyles.label.large
    };

    return textSizes[size] || textSizes.medium;
  };

  const buttonStyles = [
    styles.button,
    getVariantStyles(),
    getSizeStyles(),
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style
  ];

  const textStyles = [
    styles.text,
    getTextSize(),
    { color: getTextColor() },
    disabled && styles.disabledText,
    textStyle
  ];

  return (
    <Pressable
      style={({ pressed }) => [
        ...buttonStyles,
        pressed && !disabled && styles.pressed
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      accessibilityLabel={title}
      {...props}
    >
      {({ pressed }) => (
        <>
          {loading ? (
            <ActivityIndicator 
              size="small" 
              color={getTextColor()} 
              style={styles.loader}
            />
          ) : (
            <>
              {icon && iconPosition === 'left' && (
                <Text style={[textStyles, styles.icon]}>{icon}</Text>
              )}
              
              <Text style={textStyles} numberOfLines={1}>
                {title}
              </Text>
              
              {icon && iconPosition === 'right' && (
                <Text style={[textStyles, styles.icon]}>{icon}</Text>
              )}
            </>
          )}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  fullWidth: {
    width: '100%'
  },
  text: {
    textAlign: 'center',
    fontWeight: LuxuryTheme.typography.fontWeight.semiBold
  },
  icon: {
    marginHorizontal: LuxuryTheme.spacing[2]
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }]
  },
  disabled: {
    opacity: 0.5
  },
  disabledText: {
    opacity: 0.6
  },
  loader: {
    marginVertical: LuxuryTheme.spacing[1]
  }
});

export default LuxuryButton;